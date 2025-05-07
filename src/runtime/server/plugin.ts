import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { getRequestHeader } from 'h3'
import { deepCopy } from '@intlify/shared'
import { defineNitroPlugin } from 'nitropack/runtime'
import { tryUseI18nContext, createI18nContext } from './context'
import { createDefaultLocaleDetector, createUserLocaleDetector } from './utils/locale-detector'
import { pickNested } from './utils/messages-utils'
import { isLocaleWithFallbacksCacheable } from './utils/cache'
import { getAllMergedMessages, getMergedMessages } from './utils/messages'
import { getFallbackLocaleCodes } from '../shared/messages'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { setupVueI18nOptions } from '../shared/vue-i18n'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'

export default defineNitroPlugin(async nitro => {
  const options = await setupVueI18nOptions()
  const localeCodes = Object.keys(options.messages)

  const localeFromRoute = createLocaleFromRouteGetter({
    separator: __ROUTE_NAME_SEPARATOR__,
    defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
    localeCodes
  })

  const defaultLocaleDetector = createDefaultLocaleDetector({
    defaultLocale: options.locale,
    tryRouteLocale: (event: H3Event) => localeFromRoute(event.path) || null
  })

  const getFallbackLocales = (locale: string) => getFallbackLocaleCodes(options.fallbackLocale, [locale])

  const localeConfigs: Record<string, { cacheable: boolean; fallbacks: string[] }> = {}
  for (const locale of localeCodes) {
    const fallbacks = getFallbackLocales(locale)
    const cacheable = isLocaleWithFallbacksCacheable(locale, fallbacks)
    localeConfigs[locale] = { fallbacks, cacheable }
  }

  nitro.hooks.hook('request', async (event: H3Event) => {
    const ctx = createI18nContext({ getFallbackLocales, localeConfigs })
    event.context.nuxtI18n = ctx
    event.context.vueI18nOptions = options

    for (const locale of localeCodes) {
      ctx.messages[locale] ??= {}
      deepCopy(options.messages[locale], ctx.messages[locale])
    }

    // skip if the request is internal
    if (getRequestHeader(event, 'x-nuxt-i18n')) return

    const locale = defaultLocaleDetector(event)
    const messages = __LAZY_LOCALES__ // load messages for detected locale if lazy loading is enabled
      ? await getMergedMessages(locale, localeConfigs?.[locale]?.fallbacks ?? [])
      : await getAllMergedMessages(localeCodes)
    deepCopy(messages, ctx.messages)
  })

  if (__I18N_PRELOAD__) {
    nitro.hooks.hook('render:html', (htmlContext, { event }) => {
      const ctx = tryUseI18nContext(event)
      if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) return

      // only include the messages used in the current page
      if (__I18N_STRIP_UNUSED__ && !__IS_SSG__) {
        const trackedLocales = Object.keys(ctx.trackMap)
        for (const locale of Object.keys(ctx.messages)) {
          if (!trackedLocales.includes(locale)) {
            ctx.messages[locale] = {}
            continue
          }

          const usedKeys = Array.from(ctx.trackMap[locale])
          ctx.messages[locale] = pickNested(usedKeys, ctx.messages[locale]) as unknown as Record<string, string>
        }
      }

      const stringified = stringify(ctx.messages)
      if (import.meta.dev) {
        const size = getStringSizeKB(stringified)
        if (size > 10) {
          console.log(
            `Preloading a large messages object for ${Object.keys(ctx.messages).length} locales: ${size.toFixed(2)} KB`
          )
        }
      }

      try {
        htmlContext.bodyAppend.unshift(
          `<script type="application/json" data-nuxt-i18n="${appId}">${stringified}</script>`
        )
      } catch (_) {
        console.log(_)
      }
    })
  }

  // enable server-side translations and user locale-detector
  if (localeDetector != null) {
    const i18nMiddleware = defineI18nMiddleware({
      ...(options as CoreOptions),
      locale: createUserLocaleDetector(options.locale, options.fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})

function getStringSizeKB(str: string): number {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  return encoded.length / 1024
}

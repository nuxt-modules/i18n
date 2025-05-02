import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { getRequestHeader } from 'h3'
import { deepCopy } from '@intlify/shared'
import { useRuntimeConfig, defineNitroPlugin } from 'nitropack/runtime'
import { tryUseI18nContext, createI18nContext } from './context'
import { createDefaultLocaleDetector, createUserLocaleDetector } from './utils/locale-detector'
import { loadVueI18nOptions, makeFallbackLocaleCodes } from '../messages'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { localeCodes, vueI18nConfigs } from '#internal/i18n/options.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export default defineNitroPlugin(async nitro => {
  // load initial locale messages for intlify/h3
  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = await loadVueI18nOptions(vueI18nConfigs)
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false)
  options.messages = options.messages || {}
  for (const locale of localeCodes) {
    options.messages[locale] ??= {}
  }

  const runtimeI18n = useRuntimeConfig().public.i18n as unknown as I18nPublicRuntimeConfig
  const initialLocale = runtimeI18n.defaultLocale || options.locale || 'en-US'

  const localeFromRoute = createLocaleFromRouteGetter({
    separator: __ROUTE_NAME_SEPARATOR__,
    defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
    localeCodes
  })

  const defaultLocaleDetector = createDefaultLocaleDetector({
    defaultLocale: initialLocale,
    tryRouteLocale: (event: H3Event) => localeFromRoute(event.path) || null
  })

  const getFallbackLocales = (locale: string) => makeFallbackLocaleCodes(fallbackLocale, [locale])

  nitro.hooks.hook('request', async (event: H3Event) => {
    const ctx = createI18nContext({ getFallbackLocales })
    event.context.nuxtI18n = ctx

    if (getRequestHeader(event, 'x-nuxt-i18n') !== 'internal') {
      ctx.locale = defaultLocaleDetector(event)
      if (!__LAZY_LOCALES__) {
        const localeMessages = await Promise.all(localeCodes.map(locale => ctx.getMessages(locale)))
        for (const messages of localeMessages) {
          deepCopy(messages, ctx.messages)
        }
      } else {
        ctx.messages = await ctx.getMessages(ctx.locale)
      }
    }
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    const ctx = tryUseI18nContext(event)
    if (ctx == null || Object.keys(ctx.messages ?? {}).length == 0) return

    try {
      htmlContext.bodyAppend.unshift(
        `<script type="application/json" data-nuxt-i18n="${appId}">${stringify(ctx.messages)}</script>`
      )
    } catch (_) {
      console.log(_)
    }
  })

  // enable server-side translations and user locale-detector
  if (localeDetector != null) {
    const i18nMiddleware = defineI18nMiddleware({
      ...(options as CoreOptions),
      locale: createUserLocaleDetector(initialLocale, fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})

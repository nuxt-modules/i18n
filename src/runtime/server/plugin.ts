import { stringify } from 'devalue'
import { defineI18nMiddleware } from '@intlify/h3'
import { getRequestHeader } from 'h3'
import { deepCopy } from '@intlify/shared'
import { useRuntimeConfig, defineNitroPlugin } from 'nitropack/runtime'
import { tryUseI18nContext, createI18nContext, fetchMessages } from './context'
import { createDefaultLocaleDetector, createUserLocaleDetector } from './utils/locale-detector'
import { loadVueI18nOptions, getFallbackLocaleCodes } from '../messages'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { localeCodes, vueI18nConfigs } from '#internal/i18n/options.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import { isLocaleWithFallbacksCacheable } from './utils/messages'

export default defineNitroPlugin(async nitro => {
  const runtimeI18n = useRuntimeConfig().public.i18n as unknown as I18nPublicRuntimeConfig
  // load initial locale messages for @intlify/h3 (options are compatible with vue-i18n options)
  const options = await loadVueI18nOptions(vueI18nConfigs)
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false)
  const initialLocale = runtimeI18n.defaultLocale || options.locale || 'en-US'

  options.messages = options.messages || {}
  for (const locale of localeCodes) {
    options.messages[locale] ??= {}
  }

  const localeFromRoute = createLocaleFromRouteGetter({
    separator: __ROUTE_NAME_SEPARATOR__,
    defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
    localeCodes
  })

  const defaultLocaleDetector = createDefaultLocaleDetector({
    defaultLocale: initialLocale,
    tryRouteLocale: (event: H3Event) => localeFromRoute(event.path) || null
  })

  const getFallbackLocales = (locale: string) => getFallbackLocaleCodes(fallbackLocale, [locale])

  const localeConfigs: Record<string, { cacheable: boolean; fallbacks: string[] }> = {}
  for (const locale of localeCodes) {
    const fallbacks = getFallbackLocales(locale)
    const cacheable = isLocaleWithFallbacksCacheable(locale, fallbacks)
    localeConfigs[locale] = { fallbacks, cacheable }
  }

  nitro.hooks.hook('request', async (event: H3Event) => {
    const ctx = createI18nContext({ getFallbackLocales, localeConfigs })
    event.context.nuxtI18n = ctx

    // skip if the request is internal
    if (getRequestHeader(event, 'x-nuxt-i18n')) return

    if (!__LAZY_LOCALES__) {
      const messages = await Promise.all(localeCodes.map(fetchMessages))
      for (const m of messages) {
        deepCopy(m, ctx.messages)
      }
    } else {
      ctx.messages = await fetchMessages(defaultLocaleDetector(event))
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

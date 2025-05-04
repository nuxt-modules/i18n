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
import { localeCodes as _localeCodes, vueI18nConfigs } from '#internal/i18n/options.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { I18nOptions } from 'vue-i18n'
import { isLocaleWithFallbacksCacheable } from './utils/messages'

type ResolvedI18nOptions = Omit<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'> &
  Required<Pick<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'>>

// load initial locale messages for @intlify/h3 (options are compatible with vue-i18n options)
const setupVueI18nOptions = async (): Promise<ResolvedI18nOptions> => {
  const runtimeI18n = useRuntimeConfig().public.i18n as unknown as I18nPublicRuntimeConfig
  const options = await loadVueI18nOptions(vueI18nConfigs)

  options.locale = runtimeI18n.defaultLocale || options.locale || 'en-US'
  options.fallbackLocale = options.fallbackLocale ?? false

  options.messages ??= {}
  for (const locale of _localeCodes) {
    options.messages[locale] ??= {}
  }

  return options as ResolvedI18nOptions
}

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

    for (const locale of localeCodes) {
      ctx.messages[locale] ??= {}
      deepCopy(options.messages[locale], ctx.messages[locale])
    }

    // skip if the request is internal
    if (getRequestHeader(event, 'x-nuxt-i18n')) return

    if (!__LAZY_LOCALES__) {
      const messagesArr = await Promise.all(localeCodes.map(fetchMessages))
      for (const messages of messagesArr) {
        deepCopy(messages, ctx.messages)
      }
    } else {
      const messages = await fetchMessages(defaultLocaleDetector(event))
      deepCopy(messages, ctx.messages)
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
      locale: createUserLocaleDetector(options.locale, options.fallbackLocale)
    })

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})

import { stringify } from 'devalue'
import { useRuntimeConfig } from '#imports'
import { defineI18nMiddleware } from '@intlify/h3'
import { deepCopy } from '@intlify/shared'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { localeCodes, vueI18nConfigs, localeLoaders } from '#internal/i18n/options.mjs'
import { createDefaultLocaleDetector, createUserLocaleDetector } from './utils/locale-detector'
import { loadVueI18nOptions, loadInitialMessages, makeFallbackLocaleCodes, loadAndSetLocaleMessages } from '../messages'
// @ts-expect-error virtual file
import { appId, appBuildAssetsDir } from '#internal/nuxt.config.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import type { DefineLocaleMessage, LocaleMessages } from 'vue-i18n'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

// keep a map of messages loaded from files
// vue-i18n messages may contain non-serializable values (e.g. functions, symbols, etc.)
// const serializableMessages = new Map<string, LocaleMessages<DefineLocaleMessage>>()
const serializableMessages: Record<string, LocaleMessages<DefineLocaleMessage>> = {}
const initialMessages: Record<string, LocaleMessages<DefineLocaleMessage>> = {}

/**
 * Skip requests for static assets
 */
function shouldSkipRequest(event: H3Event) {
  return event.path.startsWith('/favicon.ico') || event.path.startsWith(appBuildAssetsDir)
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export default defineNitroPlugin(async nitro => {
  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = await loadVueI18nOptions(vueI18nConfigs)
  options.messages = options.messages || {}
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false)

  const runtimeI18n = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
  const initialLocale = runtimeI18n.defaultLocale || options.locale || 'en-US'

  const routeDetector = createLocaleFromRouteGetter({
    separator: __ROUTE_NAME_SEPARATOR__,
    defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
    localeCodes
  })

  const defaultLocaleDetector = createDefaultLocaleDetector({
    defaultLocale: initialLocale,
    tryRouteLocale: (event: H3Event) => routeDetector(event.path) || null
  })

  // load initial locale messages for intlify/h3
  await loadInitialMessages(initialMessages, localeLoaders, {
    localeCodes,
    initialLocale,
    defaultLocale: runtimeI18n.defaultLocale,
    fallbackLocale: options.fallbackLocale
  })

  // merge serializable messages into options.messages (vue-i18n messages)
  for (const locale in initialMessages) {
    options.messages[locale] ??= {}
    deepCopy(initialMessages[locale], options.messages[locale])

    serializableMessages[locale] ??= {}
    deepCopy(initialMessages[locale], serializableMessages[locale])
  }

  if (!__LAZY_LOCALES__) {
    await Promise.all(localeCodes.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, serializableMessages!)))
  }

  nitro.hooks.hook('request', async (event: H3Event) => {
    if (shouldSkipRequest(event)) return

    const locale = defaultLocaleDetector(event, options as CoreOptions<string, DefineLocaleMessage>)
    const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [locale])

    if (__LAZY_LOCALES__) {
      if (fallbackLocale) {
        await Promise.all(
          fallbackLocales.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, serializableMessages!))
        )
      }
      await loadAndSetLocaleMessages(locale, localeLoaders, serializableMessages!)
    }

    event.context.i18nCache = serializableMessages
    event.context.i18nLocales = Array.from(new Set(fallbackLocales.concat(locale))).filter(Boolean)
  })

  nitro.hooks.hook('render:html', (htmlContext, { event }) => {
    try {
      const subset: Record<string, LocaleMessages<DefineLocaleMessage>> = {}
      for (const locale of event.context.i18nLocales) {
        subset[locale] = event.context.i18nCache[locale]
      }
      htmlContext.bodyAppend.unshift(
        `<script type="application/json" data-nuxt-i18n="${appId}">${stringify(subset)}</script>`
      )
    } catch (_) {
      console.log(_)
    }
  })

  // enable server-side translations and user locale-detector
  if (localeDetector != null) {
    const i18nMiddleware = defineI18nMiddleware({
      ...options,
      locale: createUserLocaleDetector(initialLocale, fallbackLocale)
    } as Parameters<typeof defineI18nMiddleware>[0])

    nitro.hooks.hook('request', i18nMiddleware.onRequest)
    nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
  }
})

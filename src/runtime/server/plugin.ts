import { stringify } from 'devalue'
import { useRuntimeConfig } from '#imports'
import { defineI18nMiddleware } from '@intlify/h3'
import type { CoreOptions } from '@intlify/core'
import { deepCopy } from '@intlify/shared'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { localeCodes, vueI18nConfigs, localeLoaders } from '#internal/i18n/options.mjs'
import { loadVueI18nOptions, loadInitialMessages, makeFallbackLocaleCodes, loadAndSetLocaleMessages } from '../messages'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'

import type { H3Event } from 'h3'
import type { Locale, DefineLocaleMessage, FallbackLocale, LocaleMessages } from 'vue-i18n'
import type { I18nPublicRuntimeConfig } from '~/src/types'
import { createDefaultLocaleDetector } from './utils/default-detector'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'

// keep a map of messages loaded from files
// vue-i18n messages may contain non-serializable values (e.g. functions, symbols, etc.)
// const serializableMessages = new Map<string, LocaleMessages<DefineLocaleMessage>>()
const serializableMessages: Record<string, LocaleMessages<DefineLocaleMessage>> = {}
const initialMessages: Record<string, LocaleMessages<DefineLocaleMessage>> = {}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export default defineNitroPlugin(async nitro => {
  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = await loadVueI18nOptions(vueI18nConfigs)
  options.messages = options.messages || {}
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false)

  const runtimeI18n = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
  const initialLocale = runtimeI18n.defaultLocale || options.locale || 'en-US'

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

  const routeDetector = createLocaleFromRouteGetter({
    separator: __ROUTE_NAME_SEPARATOR__,
    defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
    localeCodes
  })

  const tryRouteLocale = (event: H3Event) => routeDetector(event.path) || null
  const defaultDetector = createDefaultLocaleDetector(tryRouteLocale)

  nitro.hooks.hook('request', async (event: H3Event) => {
    const locale = defaultDetector(event, options as CoreOptions<string, DefineLocaleMessage>)
    const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [locale])
    if (__LAZY_LOCALES__) {
      if (fallbackLocale) {
        await Promise.all(
          fallbackLocales.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, serializableMessages!))
        )
      }
      await loadAndSetLocaleMessages(locale, localeLoaders, serializableMessages!)
    } else {
      await Promise.all(
        localeCodes.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, serializableMessages!))
      )
    }

    event.context.i18nLocales = Array.from(new Set(fallbackLocales.concat(locale)))
    event.context.i18nCache = serializableMessages
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

  const i18nMiddleware = defineI18nMiddleware({
    ...options,
    locale: createLocaleDetector(initialLocale, fallbackLocale)
  } as Parameters<typeof defineI18nMiddleware>[0])

  nitro.hooks.hook('request', i18nMiddleware.onRequest)
  nitro.hooks.hook('afterResponse', i18nMiddleware.onAfterResponse)
})

function createLocaleDetector(defaultLocale: string, fallbackLocale: FallbackLocale) {
  return async (event: H3Event, i18nContext: CoreOptions<string, DefineLocaleMessage>): Promise<Locale> => {
    const locale = localeDetector(event, { defaultLocale, fallbackLocale })
    // load locale messages in case earlier handling has not detected the same locale
    const hasLocale = event.context.i18nLocales.includes(locale)
    if (hasLocale) {
      for (const locale of event.context.i18nLocales) {
        i18nContext.messages![locale] ??= {}
        deepCopy(event.context.i18nCache[locale], i18nContext.messages![locale])
      }
    } else {
      if (__LAZY_LOCALES__) {
        if (fallbackLocale) {
          const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [locale])
          await Promise.all(
            fallbackLocales.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, i18nContext.messages!))
          )
        }
        await loadAndSetLocaleMessages(locale, localeLoaders, i18nContext.messages!)
      }
    }
    return locale
  }
}

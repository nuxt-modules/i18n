import { defineI18nMiddleware } from '@intlify/h3'
import { deepCopy } from '@intlify/shared'
import { nuxtI18nOptions, localeCodes, vueI18nConfigs, localeMessages } from '#internal/i18n/options.mjs'
// @ts-ignore
import { localeDetector as _localeDetector } from '#internal/i18n/locale.detector.mjs'
import { loadVueI18nOptions, loadInitialMessages, makeFallbackLocaleCodes, loadLocale } from '../messages'

import type { NitroAppPlugin } from 'nitropack'
import type { H3Event } from 'h3'
import type { NuxtApp } from 'nuxt/dist/app'
import type { Locale, FallbackLocale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { CoreContext } from '@intlify/h3'

const nuxtMock: { runWithContext: NuxtApp['runWithContext'] } = { runWithContext: async fn => await fn() }

export const nitroPlugin: NitroAppPlugin = async nitro => {
  // cache for locale messages
  const cacheMessages = new Map<string, LocaleMessages<DefineLocaleMessage>>()

  console.log('nitro plugin test: load nuxt i18n options at nitro plugin ---->', localeMessages, vueI18nConfigs)
  console.log('nitro plugin test: load nuxt i18n options at nitro plugin via virtual module ---->', _localeDetector)

  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = (await loadVueI18nOptions(vueI18nConfigs, nuxtMock)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
  options.messages = options.messages || {}
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false) as FallbackLocale

  const { defaultLocale, lazy } = nuxtI18nOptions
  const initialLocale = defaultLocale || options.locale || 'en-US'

  // load initial locale messages for intlify/h3
  options.messages = await loadInitialMessages(options.messages, localeMessages, {
    ...nuxtI18nOptions,
    initialLocale,
    fallbackLocale: options.fallbackLocale,
    localeCodes,
    cacheMessages
  })

  console.log('nitro plugin test: load vue i18n options at nitro plugin ---->', options.messages)

  const localeDetector = async (
    event: H3Event,
    i18nContext: CoreContext<string, DefineLocaleMessage>
  ): Promise<Locale> => {
    const locale = _localeDetector(event)
    if (lazy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setter = (locale: Locale, message: Record<string, any>) => {
        i18nContext.messages[locale] = i18nContext.messages[locale] || {}
        deepCopy(message, i18nContext.messages[locale])
      }
      if (fallbackLocale) {
        const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [locale])
        await Promise.all(fallbackLocales.map(locale => loadLocale({ locale, setter, localeMessages }, cacheMessages)))
      }
      await loadLocale({ locale, setter, localeMessages }, cacheMessages)
    }
    return locale
  }

  const { onRequest, onAfterResponse } = defineI18nMiddleware({
    ...options,
    locale: localeDetector
  })

  nitro.hooks.hook('request', onRequest)
  nitro.hooks.hook('afterResponse', onAfterResponse)
}

export default nitroPlugin

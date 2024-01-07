import { defineI18nMiddleware } from '@intlify/h3'
import { nuxtI18nOptions, localeCodes, vueI18nConfigs, localeLoaders } from '#internal/i18n/options.mjs'
// @ts-ignore
import { localeDetector as _localeDetector } from '#internal/i18n/locale.detector.mjs'
import { loadVueI18nOptions, loadInitialMessages, makeFallbackLocaleCodes, loadAndSetLocaleMessages } from '../messages'

import type { NitroAppPlugin } from 'nitropack'
import type { H3Event } from 'h3'
import type { NuxtApp } from 'nuxt/app'
import type { Locale, FallbackLocale, DefineLocaleMessage } from 'vue-i18n'
import type { CoreContext } from '@intlify/h3'

const nuxtMock: { runWithContext: NuxtApp['runWithContext'] } = { runWithContext: async fn => await fn() }

export const nitroPlugin: NitroAppPlugin = async nitro => {
  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = (await loadVueI18nOptions(vueI18nConfigs, nuxtMock)) as any // eslint-disable-line @typescript-eslint/no-explicit-any
  options.messages = options.messages || {}
  const fallbackLocale = (options.fallbackLocale = options.fallbackLocale ?? false) as FallbackLocale

  const { defaultLocale, lazy } = nuxtI18nOptions
  const initialLocale = defaultLocale || options.locale || 'en-US'

  // load initial locale messages for intlify/h3
  options.messages = await loadInitialMessages(options.messages, localeLoaders, {
    localeCodes,
    initialLocale,
    lazy: nuxtI18nOptions.lazy,
    defaultLocale: nuxtI18nOptions.defaultLocale,
    fallbackLocale: options.fallbackLocale
  })

  const localeDetector = async (
    event: H3Event,
    i18nContext: CoreContext<string, DefineLocaleMessage>
  ): Promise<Locale> => {
    const locale = _localeDetector(event, { defaultLocale: initialLocale, fallbackLocale: options.fallbackLocale })
    if (lazy) {
      if (fallbackLocale) {
        const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [locale])
        await Promise.all(
          fallbackLocales.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, i18nContext.messages))
        )
      }
      await loadAndSetLocaleMessages(locale, localeLoaders, i18nContext.messages)
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

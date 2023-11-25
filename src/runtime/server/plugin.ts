import { defineI18nMiddleware } from '@intlify/h3'
import { vueI18nConfigs, localeMessages } from '#internal/i18n/options.mjs'
// @ts-ignore
import { localeDetector as _localeDetector } from '#internal/i18n/locale.detector.mjs'
import { loadVueI18nOptions } from '../messages'

import type { NitroAppPlugin } from 'nitropack'
import type { H3Event } from 'h3'
import type { NuxtApp } from 'nuxt/dist/app'

const nuxtMock: { runWithContext: NuxtApp['runWithContext'] } = { runWithContext: async fn => await fn() }

export const nitroPlugin: NitroAppPlugin = async nitro => {
  console.log('nitro plugin test: load nuxt i18n options at nitro plugin ---->', localeMessages, vueI18nConfigs)
  console.log('nitro plugin test: load nuxt i18n options at nitro plugin via virtual module ---->', _localeDetector)

  // `defineI18nMiddleware` options (internally, options passed to`createCoreContext` in intlify / core) are compatible with vue-i18n options
  const options = (await loadVueI18nOptions(vueI18nConfigs, nuxtMock)) as any // eslint-disable-line @typescript-eslint/no-explicit-any

  // NOTE:
  // WIP, custom locale detection
  // We need to respect `detectBrowserLanguage` option (navigator.language, cookie, and `locale` of nuxt i18n options),
  // And we might need to lazy-load i18n resource too
  const localeDetector = (event: H3Event) => {
    const locale = _localeDetector(event)
    console.log('localeDetector -> ', locale)
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

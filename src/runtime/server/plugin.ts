import { defineI18nMiddleware } from '@intlify/h3'
import { localeMessages, nuxtI18nOptions, isSSG } from '#build/i18n.options.mjs'
import { example } from '#build/example-file.mjs'
// @ts-ignore
import { localeDetector as _localeDetector } from '#internal/i18n/locale.detector.mjs'

import type { NitroAppPlugin } from 'nitropack'
import type { H3Event } from 'h3'

export const nitroPlugin: NitroAppPlugin = nitro => {
  console.log('nitro plugin test: load nuxt i18n options at nitro plugin ---->', localeMessages, nuxtI18nOptions, isSSG)
  console.log('nitro plugin test: load data at nitro plugin via getContents of addTemplate ---->', example)
  console.log('nitro plugin test: load nuxt i18n options at nitro plugin via virtual module ---->', _localeDetector)

  // NOTE:
  // WIP, custom locale detection
  // We need to respect `detectBrowserLanguage` option (navigator.language, cookie, and `locale` of nuxt i18n options),
  // And we might need to lazy-load i18n resource too
  const localeDetector = (event: H3Event) => {
    const locale = _localeDetector(event)
    console.log('localeDetector', locale)
    return locale
  }

  const { onRequest, onAfterResponse } = defineI18nMiddleware({
    locale: localeDetector,
    messages: {} // TODO: we need to set messages from nuxt i18n options for synchronous loading
  })

  // @ts-expect-error TODO: Argument of type '(event: any) => void' is not assignable to parameter of type 'never'.
  nitro.hooks.hook('request', onRequest)
  // @ts-expect-error TDOO: Argument of type '(event: any) => void' is not assignable to parameter of type 'never'.
  nitro.hooks.hook('afterResponse', onAfterResponse)
}

export default nitroPlugin

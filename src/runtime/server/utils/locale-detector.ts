import { fetchMessages } from '../context'
import { deepCopy } from '@intlify/shared'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { tryCookieLocale, tryHeaderLocale, tryQueryLocale } from '@intlify/h3'
import { findBrowserLocale } from '#i18n-kit/browser'
import { parseAcceptLanguage } from '@intlify/utils'
import { normalizedLocales } from '#internal/i18n/options.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions, FallbackLocale, Locale } from '@intlify/core'

/**
 * Detects the locale from the request event.
 */
export function createDefaultLocaleDetector(defaultLocale: string, tryRouteLocale: (event: H3Event) => string | null) {
  const normalized = normalizedLocales.map(x => ({ code: x.code, language: x.language ?? x.code }))
  const headerParser = (value: string) => [findBrowserLocale(normalized, parseAcceptLanguage(value))]

  /**
   * Pass `lang: ''` to `try...Locale` to prevent default value from being returned early.
   */
  function* detect(event: H3Event) {
    yield tryRouteLocale(event)

    yield tryQueryLocale(event, { lang: '' })

    yield tryCookieLocale(event, { lang: '', name: 'i18n_redirected' })

    yield tryHeaderLocale(event, { lang: '', parser: headerParser })
  }

  return (event: H3Event) => {
    for (const locale of detect(event)) {
      if (locale) {
        return locale.toString() as string
      }
    }
    return defaultLocale
  }
}

export function createUserLocaleDetector(defaultLocale: string, fallbackLocale: FallbackLocale) {
  return async (event: H3Event, i18nCtx: CoreOptions): Promise<Locale> => {
    const locale = localeDetector!(event, { defaultLocale, fallbackLocale })

    // Merge messages into i18n context which contains unserializable messages from vue-i18n configurations
    const messages = await fetchMessages(locale)
    for (const locale of Object.keys(messages)) {
      i18nCtx.messages![locale] ??= {}
      deepCopy(messages[locale], i18nCtx.messages![locale])
    }

    return locale
  }
}

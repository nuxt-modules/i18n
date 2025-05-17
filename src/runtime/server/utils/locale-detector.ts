import { fetchMessages } from '../context'
import { deepCopy } from '@intlify/shared'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { tryCookieLocale, tryHeaderLocale, tryQueryLocale } from '@intlify/h3'
import { findBrowserLocale, parseAcceptLanguage } from '#i18n-kit/browser'
import { normalizedLocales } from '#internal/i18n/options.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions, FallbackLocale, Locale } from '@intlify/core'

/**
 * Detects the locale from the request event.
 */
export function createDefaultLocaleDetector(opts: {
  defaultLocale: string
  tryRouteLocale: (event: H3Event) => string | null
}) {
  const normalized = normalizedLocales.map(x => ({ code: x.code, language: x.language ?? x.code }))

  /**
   * Pass `lang: ''` to `try...Locale` to prevent default value from being returned early.
   */
  return (event: H3Event) => {
    // try to get locale from route
    const routeLocale = opts.tryRouteLocale(event)
    if (routeLocale) {
      __DEBUG__ && console.log('locale detected from route', routeLocale, event.path)
      return routeLocale.toString() as string
    }

    // try to get locale from query
    const query = tryQueryLocale(event, { lang: '' })
    if (query) {
      __DEBUG__ && console.log('locale detected from query', query.toString())
      return query.toString() as string
    }

    // try to get locale from cookie
    const cookie = tryCookieLocale(event, { lang: '', name: 'i18n_redirected' })
    if (cookie) {
      __DEBUG__ && console.log('locale detected from cookie', cookie.toString())
      return cookie.toString() as string
    }

    // try to get locale from header (`accept-header`)
    const header = tryHeaderLocale(event, { lang: '' })
    const parsed = header && parseAcceptLanguage(header.toString())
    const resolvedHeaderLocale = parsed && findBrowserLocale(normalized, parsed)
    if (resolvedHeaderLocale) {
      __DEBUG__ && console.log('locale detected from header', resolvedHeaderLocale)
      return resolvedHeaderLocale
    }

    // If the locale cannot be resolved up to this point, it is resolved with the value `locale` of the locale config passed to the function
    __DEBUG__ && console.log('locale detected from config', opts.defaultLocale)
    return opts.defaultLocale
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

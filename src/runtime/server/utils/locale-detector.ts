import { fetchMessages } from '../context'
import { deepCopy } from '@intlify/shared'
import { localeDetector } from '#internal/i18n/locale.detector.mjs'
import { tryCookieLocale, tryHeaderLocale, tryQueryLocale } from '@intlify/h3'
import { findBrowserLocale } from '#i18n-kit/routing'
import { normalizedLocales } from '#internal/i18n/options.mjs'
import { parseAcceptLanguage } from '../../browser'

import type { H3Event } from 'h3'
import type { CoreOptions, FallbackLocale, Locale } from '@intlify/core'

export function createDefaultLocaleDetector(opts: {
  defaultLocale: string
  tryRouteLocale: (event: H3Event) => string | null
}) {
  return (event: H3Event) => {
    // try to get locale from route
    const routeLocale = opts.tryRouteLocale(event)
    if (routeLocale) {
      __DEBUG__ && console.log('locale detected from route', routeLocale, event.path)
      return routeLocale.toString() as string
    }

    // try to get locale from query
    const query = tryQueryLocale(event, { lang: '' }) // disable locale default value with `lang` option
    if (query) {
      __DEBUG__ && console.log('locale detected from query', query.toString())
      return query.toString() as string
    }

    // try to get locale from cookie
    const cookie = tryCookieLocale(event, { lang: '', name: 'i18n_redirected' }) // disable locale default value with `lang` option
    if (cookie) {
      __DEBUG__ && console.log('locale detected from cookie', cookie.toString())
      return cookie.toString() as string
    }

    // try to get locale from header (`accept-header`)
    const header = tryHeaderLocale(event, { lang: opts.defaultLocale }) // disable locale default value with `lang` option
    const parsed = header && parseAcceptLanguage(header.toString())
    if (header && parsed) {
      const resolvedHeaderLocale = findBrowserLocale(
        normalizedLocales.map(x => ({ code: x.code, language: x.language ?? x.code })),
        parsed
      )
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
    for (const locale in messages) {
      i18nCtx.messages![locale] ??= {}
      deepCopy(messages[locale], i18nCtx.messages![locale])
    }

    return locale
  }
}

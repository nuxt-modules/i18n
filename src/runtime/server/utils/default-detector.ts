import { tryCookieLocale, tryHeaderLocale, tryQueryLocale } from '@intlify/h3'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'

export function createDefaultLocaleDetector(tryRouteLocale: (event: H3Event) => string | null) {
  return (event: H3Event, config: CoreOptions<string, DefineLocaleMessage>) => {
    // try to get locale from route
    const routeLocale = tryRouteLocale(event)
    if (routeLocale) {
      return routeLocale.toString() as string
    }

    // try to get locale from query
    const query = tryQueryLocale(event, { lang: '' }) // disable locale default value with `lang` option
    if (query) {
      return query.toString() as string
    }

    // try to get locale from cookie
    const cookie = tryCookieLocale(event, { lang: '', name: 'i18n_redirected' }) // disable locale default value with `lang` option
    if (cookie) {
      return cookie.toString() as string
    }

    // try to get locale from header (`accept-header`)
    const header = tryHeaderLocale(event, { lang: '' }) // disable locale default value with `lang` option
    if (header) {
      return header.toString() as string
    }

    // If the locale cannot be resolved up to this point, it is resolved with the value `locale` of the locale config passed to the function
    return config.locale as string
  }
}

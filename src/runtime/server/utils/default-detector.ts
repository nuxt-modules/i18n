import { tryCookieLocale, tryHeaderLocale, tryQueryLocale } from '@intlify/h3'

import type { H3Event } from 'h3'
import type { CoreOptions } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'

export function createDefaultLocaleDetector(opts: {
  defaultLocale: string
  tryRouteLocale: (event: H3Event) => string | null
}) {
  return (event: H3Event, _config: CoreOptions<string, DefineLocaleMessage>) => {
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
    const header = tryHeaderLocale(event, { lang: '' }) // disable locale default value with `lang` option
    if (header) {
      __DEBUG__ && console.log('locale detected from header', header.toString())
      return header.toString() as string
    }

    // If the locale cannot be resolved up to this point, it is resolved with the value `locale` of the locale config passed to the function
    __DEBUG__ && console.log('locale detected from config', opts.defaultLocale)
    return opts.defaultLocale
  }
}

import type { H3Event } from 'h3'

// Detect based on query, cookie or header
// not using `getXLocale` functions as they return `en-US` by default if no locale is found
export default function (event: H3Event): string {
  const query = getQuery(event)
  if (query?.locale != null && typeof query.locale === 'string') {
    return query.locale
  }

  const cookie = getCookie(event, 'i18n_locale')
  if (cookie) {
    return cookie.toString()
  }

  const header = getHeader(event, 'Accept-Language')
  if (header) {
    return header.toString()
  }

  return getQueryLocale(event).toString()
}

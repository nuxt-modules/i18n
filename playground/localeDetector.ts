import type { H3Event } from 'h3'

// Detect based on query, cookie or header
// not using `getXLocale` functions as they return `en-US` by default if no locale is found
export default function (event: H3Event): string {
  const query = tryQueryLocale(event)
  if (query) {
    return query.toString()
  }

  const cookie = tryCookieLocale(event, { name: 'i18n_locale' })
  if (cookie) {
    return cookie.toString()
  }

  const header = tryHeaderLocale(event)
  if (header) {
    return header.toString()
  }

  return getQueryLocale(event).toString()
}

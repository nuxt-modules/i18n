import type { H3Event } from 'h3'

// Detect based on query, cookie or header
export default function (event: H3Event): string {
  const query = tryQueryLocale(event, { lang: undefined })
  if (query) {
    return query.toString()
  }

  const cookie = tryCookieLocale(event, { lang: undefined, name: 'i18n_locale' })
  if (cookie) {
    return cookie.toString()
  }

  const header = tryHeaderLocale(event, { lang: undefined })
  if (header) {
    return header.toString()
  }

  return getQueryLocale(event).toString()
}

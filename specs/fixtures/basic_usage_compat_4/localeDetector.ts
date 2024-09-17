// Detect based on query, cookie, header
export default defineI18nLocaleDetector((event, { defaultLocale }) => {
  console.log('hello')
  const query = tryQueryLocale(event, { lang: '' })
  if (query) {
    return query.toString()
  }

  const cookie = tryCookieLocale(event, { lang: '', name: 'i18n_locale' })
  if (cookie) {
    return cookie.toString()
  }

  const header = tryHeaderLocale(event, { lang: '' })
  if (header) {
    return header.toString()
  }

  return defaultLocale
})

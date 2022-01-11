import { parse as cookieParse, serialize as cookieSerialize } from 'cookie'
import JsCookie from 'js-cookie'

/** @typedef {import('../../types/internal').ResolvedOptions} ResolvedOptions */

/**
 * Formats a log message, prefixing module's name to it.
 *
 * @param {string} text
 * @return {string}
 */
export function formatMessage (text) {
  return `[@nuxtjs/i18n] ${text}`
}

/**
 * Parses locales provided from browser through `accept-language` header.
 *
 * @param {string} input
 * @return {string[]} An array of locale codes. Priority determined by order in array.
 */
export function parseAcceptLanguage (input) {
  // Example input: en-US,en;q=0.9,nb;q=0.8,no;q=0.7
  // Contains tags separated by comma.
  // Each tag consists of locale code (2-3 letter language code) and optionally country code
  // after dash. Tag can also contain score after semicolon, that is assumed to match order
  // so it's not explicitly used.
  return input.split(',').map(tag => tag.split(';')[0])
}

/**
 * Find locale code that best matches provided list of browser locales.
 *
 * @param {ResolvedOptions['normalizedLocales']} appLocales The user-configured locales that are to be matched.
 * @param {readonly string[]} browserLocales The locales to match against configured.
 * @return {string | undefined}
 */
export function matchBrowserLocale (appLocales, browserLocales) {
  /** @type {{ code: string, score: number }[]} */
  const matchedLocales = []

  // Normalise appLocales input
  /** @type {{ code: string, iso: string }[]} */
  const normalizedAppLocales = []
  for (const appLocale of appLocales) {
    const { code } = appLocale
    const iso = appLocale.iso || code
    normalizedAppLocales.push({ code, iso })
  }

  // First pass: match exact locale.
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = normalizedAppLocales.find(appLocale => appLocale.iso.toLowerCase() === browserCode.toLowerCase())
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length })
      break
    }
  }

  // Second pass: match only locale code part of the browser locale (not including country).
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split('-')[0].toLowerCase()
    const matchedLocale = normalizedAppLocales.find(appLocale => appLocale.iso.split('-')[0].toLowerCase() === languageCode)
    if (matchedLocale) {
      // Deduct a thousandth for being non-exact match.
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length })
      break
    }
  }

  // Sort the list by score (0 - lowest, 1 - highest).
  if (matchedLocales.length > 1) {
    matchedLocales.sort((localeA, localeB) => {
      if (localeA.score === localeB.score) {
        // If scores are equal then pick more specific (longer) code.
        return localeB.code.length - localeA.code.length
      }

      return localeB.score - localeA.score
    })
  }

  return matchedLocales.length ? matchedLocales[0].code : undefined
}

/**
 * Get locale code that corresponds to current hostname
 *
 * @param  {ResolvedOptions['normalizedLocales']} locales
 * @param  {import('http').IncomingMessage | undefined} req
 * @return {string} Locale code found if any
 */
export function getLocaleDomain (locales, req) {
  /** @type {string | undefined} */
  let host

  if (process.client) {
    host = window.location.host
  } else if (req) {
    const detectedHost = req.headers['x-forwarded-host'] || req.headers.host
    host = Array.isArray(detectedHost) ? detectedHost[0] : detectedHost
  }

  if (host) {
    const matchingLocale = locales.find(l => l.domain === host)
    if (matchingLocale) {
      return matchingLocale.code
    }
  }

  return ''
}

/**
 * Creates a RegExp for route paths
 *
 * @param  {readonly string[]} localeCodes
 * @return {RegExp}
 */
export function getLocalesRegex (localeCodes) {
  return new RegExp(`^/(${localeCodes.join('|')})(?:/|$)`, 'i')
}

/**
 * Creates getter for getLocaleFromRoute
 *
 * @param  {readonly string[]} localeCodes
 * @param  {Pick<ResolvedOptions, 'routesNameSeparator' | 'defaultLocaleRouteNameSuffix'>} options
 */
export function createLocaleFromRouteGetter (localeCodes, { routesNameSeparator, defaultLocaleRouteNameSuffix }) {
  const localesPattern = `(${localeCodes.join('|')})`
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`
  const regexpName = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, 'i')
  const regexpPath = getLocalesRegex(localeCodes)
  /**
   * Extract locale code from given route:
   * - If route has a name, try to extract locale from it
   * - Otherwise, fall back to using the routes'path
   * @param  {import('vue-router').Route} route
   * @return {string} Locale code found if any
   */
  const getLocaleFromRoute = route => {
    // Extract from route name
    if (route.name) {
      const matches = route.name.match(regexpName)
      if (matches && matches.length > 1) {
        return matches[1]
      }
    } else if (route.path) {
      // Extract from path
      const matches = route.path.match(regexpPath)
      if (matches && matches.length > 1) {
        return matches[1]
      }
    }

    return ''
  }

  return getLocaleFromRoute
}

/**
 * @param {import('http').IncomingMessage | undefined} req
 * @param {{ useCookie: boolean, cookieKey: string, localeCodes: readonly string[] }} options
 * @return {string | undefined}
 */
export function getLocaleCookie (req, { useCookie, cookieKey, localeCodes }) {
  if (useCookie) {
    let localeCode

    if (process.client) {
      localeCode = JsCookie.get(cookieKey)
    } else if (req && typeof req.headers.cookie !== 'undefined') {
      const cookies = req.headers && req.headers.cookie ? cookieParse(req.headers.cookie) : {}
      localeCode = cookies[cookieKey]
    }

    if (localeCode && localeCodes.includes(localeCode)) {
      return localeCode
    }
  }
}

/**
 * @param {string} locale
 * @param {import('http').ServerResponse | undefined} res
 * @param {{ useCookie: boolean, cookieDomain: string | null, cookieKey: string, cookieSecure: boolean, cookieCrossOrigin: boolean}} options
 */
export function setLocaleCookie (locale, res, { useCookie, cookieDomain, cookieKey, cookieSecure, cookieCrossOrigin }) {
  if (!useCookie) {
    return
  }
  const date = new Date()
  /** @type {import('cookie').CookieSerializeOptions} */
  const cookieOptions = {
    expires: new Date(date.setDate(date.getDate() + 365)),
    path: '/',
    sameSite: cookieCrossOrigin ? 'none' : 'lax',
    secure: cookieCrossOrigin || cookieSecure
  }

  if (cookieDomain) {
    cookieOptions.domain = cookieDomain
  }

  if (process.client) {
    // @ts-ignore
    JsCookie.set(cookieKey, locale, cookieOptions)
  } else if (res) {
    let headers = res.getHeader('Set-Cookie') || []
    if (!Array.isArray(headers)) {
      headers = [String(headers)]
    }

    const redirectCookie = cookieSerialize(cookieKey, locale, cookieOptions)
    headers.push(redirectCookie)

    res.setHeader('Set-Cookie', headers)
  }
}

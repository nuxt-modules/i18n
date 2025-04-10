import type { BrowserLocale, Locale, RouteName, RouteObject } from './types'

/**
 * The browser locale matcher
 *
 * @param locales - The target {@link LocaleObject | locale} list
 * @param browserLocales - The locale code list that is used in browser
 *
 * @returns The matched {@link BrowserLocale | locale info}
 */
function matchBrowserLocale(locales: Locale[], browserLocales: readonly string[]): BrowserLocale[] {
  const matchedLocales: BrowserLocale[] = []

  // first pass: match exact locale.
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = locales.find(l => l.language?.toLowerCase() === browserCode.toLowerCase())
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length })
      break
    }
  }

  // second pass: match only locale code part of the browser locale (not including country).
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split('-')[0].toLowerCase()
    const matchedLocale = locales.find(l => l.language?.split('-')[0].toLowerCase() === languageCode)
    if (matchedLocale) {
      // deduct a thousandth for being non-exact match.
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length })
      break
    }
  }

  return matchedLocales
}

function compareBrowserLocale(a: BrowserLocale, b: BrowserLocale): number {
  if (a.score === b.score) {
    // if scores are equal then pick more specific (longer) code.
    return b.code.length - a.code.length
  }
  return b.score - a.score
}

/**
 * Find the browser locale
 *
 * @param locales - The target {@link Locale} list
 * @param browserLocales - The locale code list that is used in browser
 *
 * @returns The matched the locale code
 * @internal
 */
export function findBrowserLocale(locales: Locale[], browserLocales: readonly string[]): string {
  const normalizedLocales = locales.map(l => ({ code: l.code, language: l.language || l.code }))
  const matchedLocales = matchBrowserLocale(normalizedLocales, browserLocales)
  if (matchedLocales.length === 0) {
    return ''
  }

  // sort by score when multiple locales matched
  if (matchedLocales.length > 1) {
    matchedLocales.sort(compareBrowserLocale)
  }

  return matchedLocales[0].code
}

export function getRouteNameLocaleRegex(
  options: { localeCodes: string[]; separator: string; defaultSuffix: string },
  localesPattern: string = getLocalesPattern(options.localeCodes)
) {
  const defaultSuffixPattern = `(?:${options.separator}${options.defaultSuffix})?`
  return new RegExp(`${options.separator}${localesPattern}${defaultSuffixPattern}$`, 'i')
}

/**
 * Convenience function to return the first match of the regex or empty string
 * @internal
 */
export function createNameLocaleRegexMatcher(re: RegExp) {
  return (val: string) => val.match(re)?.[1] ?? ''
}

/**
 * Normalizes {@link RouteName} to string
 * @internal
 */
export function normalizeRouteName(routeName: RouteName) {
  if (typeof routeName === 'string') return routeName
  if (routeName != null) return routeName.toString()
  return ''
}

/**
 * Normalizes {@link RouteName} or {@link RouteObject} to string
 * @internal
 */
export function getRouteName(route: RouteName | RouteObject) {
  if (typeof route === 'object') return normalizeRouteName(route?.name)
  return normalizeRouteName(route)
}

/**
 * Extract route name without localization from {@link RouteName} or {@link RouteObject}
 * @internal
 */
export function getRouteBaseName(route: RouteName | RouteObject, separator: string) {
  return getRouteName(route).split(separator)[0]
}

export function getLocalizedRouteName(
  routeName: string,
  locale: string,
  isDefault: boolean,
  separator: string = '___',
  defaultSuffix: string = 'default'
) {
  if (isDefault) {
    return routeName + separator + locale + separator + defaultSuffix
  }
  return routeName + separator + locale
}

/**
 * Match locale code from route path (e.g. `/en/about` => `en`)
 * @internal
 */
export function getRoutePathLocaleRegex(
  localeCodes: string[],
  localesPattern: string = getLocalesPattern(localeCodes)
) {
  return new RegExp(`^/${localesPattern}(?:/|$)`, 'i')
}

function getLocalesPattern(localeCodes: string[]) {
  return `(${localeCodes.join('|')})`
}

/**
 * NOTE: this likely needs to be implemented on the utility function consumer side
 * @internal
 */
export function createLocaleFromRouteGetter(options: {
  localeCodes: string[]
  separator: string
  defaultSuffix: string
}) {
  const localesPattern = getLocalesPattern(options.localeCodes)
  const regexpName = getRouteNameLocaleRegex(options, localesPattern)
  const regexpPath = getRoutePathLocaleRegex(options.localeCodes, localesPattern)

  const matchPath = createNameLocaleRegexMatcher(regexpPath)
  const matchName = createNameLocaleRegexMatcher(regexpName)

  /**
   * extract locale code from route name or path
   */
  return (route: RouteName | RouteObject) => {
    if (typeof route === 'string') {
      return matchPath(route)
    }

    if (typeof route === 'symbol') {
      return matchPath(String(route))
    }

    // extract from route name
    if (route?.name) {
      return matchName(normalizeRouteName(route.name))
    }

    // extract from path
    if (route?.path) {
      return matchPath(route.path)
    }

    return ''
  }
}

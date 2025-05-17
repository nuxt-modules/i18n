import type { RouteName, RouteObject } from './types'

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

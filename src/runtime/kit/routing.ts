import { parsePath, withTrailingSlash, withoutTrailingSlash } from 'ufo'
import type { Strategies } from '#internal-i18n-types'
import type { RouteName, RouteObject } from './types'

const separator = __ROUTE_NAME_SEPARATOR__ || '___'
const defaultSuffix = __ROUTE_NAME_DEFAULT_SUFFIX__ || 'default'
export const defaultRouteNameSuffix = separator + defaultSuffix

/**
 * Normalizes {@link RouteName} to string
 */
export function normalizeRouteName(routeName: RouteName) {
  if (typeof routeName === 'string') { return routeName }
  if (routeName != null) { return routeName.toString() }
  return ''
}

/**
 * Extract route name without localization from {@link RouteName} or {@link RouteObject}
 */
export function getRouteBaseName(route: RouteName | RouteObject) {
  return normalizeRouteName(typeof route === 'object' ? route?.name : route).split(separator)[0]
}

export function getLocalizedRouteName(routeName: string, locale: string, isDefault: boolean) {
  return !isDefault
    ? routeName + separator + locale
    : routeName + separator + locale + defaultRouteNameSuffix
}

export const createTrailingSlashFormatter = (trailingSlash: boolean) =>
  trailingSlash ? withTrailingSlash : withoutTrailingSlash

export type PrefixableOptions = {
  strategy: Strategies
  /** Whether routes are localized (pages enabled and strategy is not `no_prefix`) */
  routing: boolean
  /** Whether locales are resolved from domains */
  domains: boolean
}

export function prefixable(currentLocale: string, defaultLocale: string, options: Pick<PrefixableOptions, 'strategy' | 'routing'>): boolean {
  // `defaultLocale` is the domain's default under domain setups, no exemption needed
  return options.routing && (currentLocale !== defaultLocale || options.strategy === 'prefix')
}

/**
 * Extract the locale from a route path. A locale code may span more than one path segment
 * (`en/formal`), so recognizing one takes matching against the actual configured codes rather than
 * just taking the first `/`-delimited segment. Trims one segment off the end at a time, so a
 * configured `en/formal` is not shadowed by a shorter, coincidentally matching `en`. Costs
 * one pass over the path's own segments rather than over `localeCodes`, so it stays cheap regardless
 * of how many locales are configured.
 */
export function getLocaleFromRoutePath(path: string, localeCodes: readonly string[]): string {
  const { pathname } = parsePath(path)
  let candidate = pathname[0] === '/' ? pathname.slice(1) : pathname

  while (candidate) {
    if (localeCodes.includes(candidate)) { return candidate }
    const lastSlash = candidate.lastIndexOf('/')
    if (lastSlash === -1) { break }
    candidate = candidate.slice(0, lastSlash)
  }
  return ''
}

export const getLocaleFromRouteName = (name: string) => name.split(separator).at(1) ?? ''

function normalizeInput(input: RouteName | RouteObject) {
  return typeof input !== 'object'
    ? String(input)
    : String(input?.name || input?.path || '')
}

/**
 * Extract locale code from route name or path
 */
export function getLocaleFromRoute(route: RouteName | RouteObject, localeCodes: readonly string[]) {
  const input = normalizeInput(route)
  if (input[0] === '/') {
    return getLocaleFromRoutePath(input, localeCodes)
  }

  const fromName = getLocaleFromRouteName(input)
  if (fromName) { return fromName }

  // Fallback: for compact routes the name has no locale suffix,
  // try path-based detection if the route object has a path.
  if (typeof route === 'object' && route?.path) {
    return getLocaleFromRoutePath(String(route.path), localeCodes)
  }

  return ''
}

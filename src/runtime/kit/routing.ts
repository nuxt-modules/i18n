import { createPathIndexLanguageParser } from '@intlify/utils'
import { withTrailingSlash, withoutTrailingSlash } from 'ufo'
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

export const formatTrailingSlash = __TRAILING_SLASH__ ? withTrailingSlash : withoutTrailingSlash

export function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    !__DIFFERENT_DOMAINS__
    && __I18N_ROUTING__
    // only prefix default locale with strategy prefix
    && (currentLocale !== defaultLocale || __I18N_STRATEGY__ === 'prefix')
  )
}

const pathLanguageParser = createPathIndexLanguageParser(0)
export const getLocaleFromRoutePath = (path: string) => pathLanguageParser(path)
export const getLocaleFromRouteName = (name: string) => name.split(separator).at(1) ?? ''

function normalizeInput(input: RouteName | RouteObject) {
  return typeof input !== 'object'
    ? String(input)
    : String(input?.name || input?.path || '')
}

/**
 * Extract locale code from route name or path
 */
export function getLocaleFromRoute(route: RouteName | RouteObject) {
  const input = normalizeInput(route)
  if (input[0] === '/') {
    return getLocaleFromRoutePath(input)
  }

  const fromName = getLocaleFromRouteName(input)
  if (fromName) { return fromName }

  // Fallback: for compact routes the name has no locale suffix,
  // try path-based detection if the route object has a path.
  if (typeof route === 'object' && route?.path) {
    return getLocaleFromRoutePath(String(route.path))
  }

  return ''
}

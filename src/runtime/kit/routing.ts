import { createPathIndexLanguageParser } from '@intlify/utils'
import type { RouteName, RouteObject } from './types'

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

const pathLanguageParser = createPathIndexLanguageParser(0)
export const getLocaleFromRoutePath = (path: string) => pathLanguageParser(path)
export const getLocaleFromRouteName = (name: string, separator: string = '___') => name.split(separator).at(1) ?? ''

function normalizeInput(input: RouteName | RouteObject) {
  if (typeof input === 'object') {
    return String(input?.name || input?.path || '')
  }
  return String(input)
}

/**
 * NOTE: this likely needs to be implemented on the utility function consumer side
 * @internal
 */
export function createLocaleFromRouteGetter(separator: string = '___') {
  // extract locale code from route name or path
  return (route: RouteName | RouteObject) => {
    const input = normalizeInput(route)
    if (input[0] === '/') {
      return getLocaleFromRoutePath(input)
    }
    return getLocaleFromRouteName(input, separator)
  }
}

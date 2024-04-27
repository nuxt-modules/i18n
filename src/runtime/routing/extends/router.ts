import { isString, isObject } from '@intlify/shared'
import { getLocalesRegex } from '../utils'
import { localeCodes } from '#build/i18n.options.mjs'

import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'

export function createLocaleFromRouteGetter(defaultLocale: string) {
  const regexpPath = getLocalesRegex(localeCodes)

  /**
   * extract locale code from given route:
   * - if route has a name, try to extract locale from it
   * - otherwise, fall back to using the routes'path
   */
  const getLocaleFromRoute = (route: RouteLocationNormalizedLoaded | RouteLocationNormalized | string): string => {
    // extract from route name
    if (isObject(route)) {
      if (route.params.locale) {
        return route.params.locale.toString()
      } else if (route.path) {
        // Extract from path
        const matches = route.path.match(regexpPath)
        if (matches && matches.length > 1) {
          return matches[1]
        }
      }
      if (route.name && route.meta && route.meta.locale) {
        return defaultLocale // #1888
      }
    } else if (isString(route)) {
      const matches = route.match(regexpPath)
      if (matches && matches.length > 1) {
        return matches[1]
      }
    }

    return ''
  }

  return getLocaleFromRoute
}

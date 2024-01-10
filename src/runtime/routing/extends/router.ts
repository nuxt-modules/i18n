import { isString, isObject, makeSymbol } from '@intlify/shared'
import { warn, getLocalesRegex } from '../utils'

import type { I18nRoutingOptions } from '#build/i18n.options.mjs'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded, Router } from 'vue-router'

/**
 * Global options for i18n routing
 */
export type I18nRoutingGlobalOptions<Context = unknown> = Pick<
  I18nRoutingOptions<Context>,
  | 'defaultLocale'
  | 'defaultDirection'
  | 'defaultLocaleRouteNameSuffix'
  | 'trailingSlash'
  | 'routesNameSeparator'
  | 'strategy'
  | 'prefixable'
  | 'switchLocalePathIntercepter'
  | 'dynamicRouteParamsKey'
> & { localeCodes?: string[] }

const GlobalOptionsRegistry = makeSymbol('nuxt-i18n-routing-gor')

/**
 * Register global i18n routing option registory
 *
 * @param router - A router instance, about router type
 * @param options - A global options, about options type, see {@link I18nRoutingGlobalOptions}
 */
export function registerGlobalOptions<Context = unknown>(
  router: Router,
  options: I18nRoutingGlobalOptions<Context>
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _options: I18nRoutingGlobalOptions | undefined = (router as any)[GlobalOptionsRegistry]
  if (_options) {
    warn('already registered global options')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(router as any)[GlobalOptionsRegistry] = options
  }
}

/**
 * Get global i18n routing options
 *
 * @param router - A router instance, about router type
 *
 * @returns - {@link I18nRoutingGlobalOptions | global options} from i18n routing options registory, if registered, return it, else empty object
 */
export function getGlobalOptions(router: Router): I18nRoutingGlobalOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (router as any)[GlobalOptionsRegistry] ?? {}
}

export function createLocaleFromRouteGetter(
  localeCodes: string[],
  routesNameSeparator: string,
  defaultLocaleRouteNameSuffix: string
) {
  const localesPattern = `(${localeCodes.join('|')})`
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`
  const regexpName = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, 'i')
  const regexpPath = getLocalesRegex(localeCodes)

  /**
   * extract locale code from given route:
   * - if route has a name, try to extract locale from it
   * - otherwise, fall back to using the routes'path
   */
  const getLocaleFromRoute = (route: RouteLocationNormalizedLoaded | RouteLocationNormalized | string): string => {
    // extract from route name
    if (isObject(route)) {
      if (route.name) {
        const name = isString(route.name) ? route.name : route.name.toString()
        const matches = name.match(regexpName)
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

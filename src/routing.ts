import { isString, assign } from '@intlify/shared'

import {
  DEFAULT_LOCALE,
  DEFAULT_LOCALE_ROUTE_NAME_SUFFIX,
  DEFAULT_ROUTES_NAME_SEPARATOR,
  DEFAULT_STRATEGY,
  DEFAULT_TRAILING_SLASH
} from 'vue-i18n-routing'

import type {
  Strategies,
  I18nRoute,
  I18nRoutingOptions,
  ComputedRouteOptions,
  RouteOptionsResolver,
  LocalizeRoutesPrefixableOptions
} from 'vue-i18n-routing'

export function adjustRoutePathForTrailingSlash(
  pagePath: string,
  trailingSlash: boolean,
  isChildWithRelativePath: boolean
) {
  return pagePath.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
}

function prefixable(optons: LocalizeRoutesPrefixableOptions): boolean {
  const { currentLocale, defaultLocale, strategy, isChild, path } = optons

  const isDefaultLocale = currentLocale === defaultLocale
  const isChildWithRelativePath = isChild && !path.startsWith('/')

  // no need to add prefix if child's path is relative
  return (
    !isChildWithRelativePath &&
    // skip default locale if strategy is 'prefix_except_default'
    !(isDefaultLocale && strategy === 'prefix_except_default')
  )
}

export const DefaultLocalizeRoutesPrefixable = prefixable

/**
 * Localize routes
 *
 * @param routes - Some routes
 * @param options - An options
 *
 * @returns Localized routes
 *
 * @public
 */
export function localizeRoutes(
  routes: I18nRoute[],
  {
    defaultLocale = DEFAULT_LOCALE,
    strategy = DEFAULT_STRATEGY as Strategies,
    trailingSlash = DEFAULT_TRAILING_SLASH,
    routesNameSeparator = DEFAULT_ROUTES_NAME_SEPARATOR,
    defaultLocaleRouteNameSuffix = DEFAULT_LOCALE_ROUTE_NAME_SUFFIX,
    includeUprefixedFallback = false,
    optionsResolver = undefined,
    localizeRoutesPrefixable = DefaultLocalizeRoutesPrefixable,
    locales = []
  }: Pick<
    I18nRoutingOptions,
    | 'defaultLocale'
    | 'strategy'
    | 'locales'
    | 'routesNameSeparator'
    | 'trailingSlash'
    | 'defaultLocaleRouteNameSuffix'
    | 'localizeRoutesPrefixable'
  > & {
    includeUprefixedFallback?: boolean
    optionsResolver?: RouteOptionsResolver
  } = {}
): I18nRoute[] {
  if (strategy === 'no_prefix') {
    return routes
  }

  // normalize localeCodes
  const _localeCodes = locales.map(locale => (isString(locale) ? locale : locale.code))

  function makeLocalizedRoutes(
    route: I18nRoute,
    allowedLocaleCodes: string[],
    isChild = false,
    isExtraPageTree = false
  ): I18nRoute[] {
    // skip route localization
    if (route.redirect && (!route.component || !route.file)) {
      return [route]
    }

    // resolve with route (page) options
    let routeOptions: ComputedRouteOptions | null = null
    if (optionsResolver != null) {
      routeOptions = optionsResolver(route, allowedLocaleCodes)
      if (routeOptions == null) {
        return [route]
      }
    }

    // component specific options
    const componentOptions: ComputedRouteOptions = {
      locales: _localeCodes,
      paths: {}
    }
    if (routeOptions != null) {
      assign(componentOptions, routeOptions)
    }
    assign(componentOptions, { locales: allowedLocaleCodes })

    // double check locales to remove any locales not found in pageOptions.
    // this is there to prevent children routes being localized even though they are disabled in the configuration.
    if (
      componentOptions.locales.length > 0 &&
      routeOptions &&
      routeOptions.locales != null &&
      routeOptions.locales.length > 0
    ) {
      const filteredLocales = []
      for (const locale of componentOptions.locales) {
        if (routeOptions.locales.includes(locale)) {
          filteredLocales.push(locale)
        }
      }
      componentOptions.locales = filteredLocales
    }

    return componentOptions.locales.reduce((_routes, locale) => {
      const { name } = route
      let { path } = route
      const localizedRoute = { ...route }

      // make localized page name
      if (name) {
        localizedRoute.name = `${name}${routesNameSeparator}${locale}`
      }

      // generate localized children routes
      if (route.children) {
        localizedRoute.children = route.children.reduce(
          (children, child) => [...children, ...makeLocalizedRoutes(child, [locale], true, isExtraPageTree)],
          [] as NonNullable<I18nRoute['children']>
        )
      }

      // get custom path if any
      if (componentOptions.paths && componentOptions.paths[locale]) {
        path = componentOptions.paths[locale]
      }

      // For 'prefix_and_default' strategy and default locale:
      // - if it's a parent page, add it with default locale suffix added (no suffix if page has children)
      // - if it's a child page of that extra parent page, append default suffix to it
      const isDefaultLocale = locale === defaultLocale
      if (isDefaultLocale && strategy === 'prefix_and_default') {
        if (!isChild) {
          const defaultRoute = { ...localizedRoute, path }

          if (name) {
            defaultRoute.name = `${localizedRoute.name}${routesNameSeparator}${defaultLocaleRouteNameSuffix}`
          }

          if (route.children) {
            // recreate child routes with default suffix added
            defaultRoute.children = []
            for (const childRoute of route.children) {
              // isExtraRouteTree argument is true to indicate that this is extra route added for 'prefix_and_default' strategy
              defaultRoute.children = defaultRoute.children.concat(
                makeLocalizedRoutes(childRoute as I18nRoute, [locale], true, true)
              )
            }
          }

          _routes.push(defaultRoute)
        } else if (isChild && isExtraPageTree && name) {
          localizedRoute.name += `${routesNameSeparator}${defaultLocaleRouteNameSuffix}`
        }
      }

      const isChildWithRelativePath = isChild && !path.startsWith('/')

      // add route prefix
      const shouldAddPrefix = localizeRoutesPrefixable({
        isChild,
        path,
        currentLocale: locale,
        defaultLocale,
        strategy
      })
      if (shouldAddPrefix) {
        path = `/${locale}${path}`
      }

      if (path) {
        path = adjustRoutePathForTrailingSlash(path, trailingSlash, isChildWithRelativePath)
      }

      if (shouldAddPrefix && isDefaultLocale && strategy === 'prefix' && includeUprefixedFallback) {
        _routes.push({ ...route })
      }

      localizedRoute.path = path
      _routes.push(localizedRoute)

      return _routes
    }, [] as I18nRoute[])
  }

  return routes.reduce(
    (localized, route) => [...localized, ...makeLocalizedRoutes(route, _localeCodes || [])],
    [] as I18nRoute[]
  )
}

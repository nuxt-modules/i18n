/* eslint-disable @typescript-eslint/no-explicit-any */
import { isString, assign } from '@intlify/shared'
import { hasProtocol, parsePath, parseQuery, withTrailingSlash, withoutTrailingSlash } from 'ufo'
import { DEFAULT_DYNAMIC_PARAMS_KEY, normalizedLocales } from '#build/i18n.options.mjs'
import { unref } from '#imports'

import { resolve, routeToObject } from './utils'
import { getLocale, getLocaleRouteName, getRouteName } from '../utils'
import { extendPrefixable, extendSwitchLocalePathIntercepter, type CommonComposableOptions } from '../../utils'

import type {
  Strategies,
  PrefixableOptions,
  SwitchLocalePathIntercepter,
  CustomRoutePages
} from '#build/i18n.options.mjs'
import type { Locale } from 'vue-i18n'
import type {
  RouteLocation,
  RouteLocationRaw,
  Router,
  RouteLocationPathRaw,
  RouteLocationNamedRaw,
  RouteLocationNormalizedLoaded,
  RouteLocationNormalized,
  LocationQuery
} from 'vue-router'

const RESOLVED_PREFIXED = new Set<Strategies>(['prefix_and_default', 'prefix_except_default'])

function prefixable(options: PrefixableOptions): boolean {
  const { currentLocale, defaultLocale, strategy } = options
  const isDefaultLocale = currentLocale === defaultLocale
  // don't prefix default locale
  return (
    !(isDefaultLocale && RESOLVED_PREFIXED.has(strategy)) &&
    // no prefix for any language
    !(strategy === 'no_prefix')
  )
}

export const DefaultPrefixable = prefixable

/**
 * Returns base name of current (if argument not provided) or passed in route.
 *
 * @remarks
 * Base name is name of the route without locale suffix and other metadata added by nuxt i18n module

 * @param common
 * @param givenRoute - A route.
 *
 * @returns The route base name. if cannot get, `undefined` is returned.
 *
 * @public
 */
export function getRouteBaseName(common: CommonComposableOptions, givenRoute?: RouteLocation): string | undefined {
  const { routesNameSeparator } = common.runtimeConfig.public.i18n
  const route = unref(givenRoute)
  if (route == null || !route.name) {
    return
  }
  const name = getRouteName(route.name)
  return name.split(routesNameSeparator)[0]
}

/**
 * Returns localized path for passed in route.
 *
 * @remarks
 * If locale is not specified, uses current locale.
 *
 * @param common
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A path of the current route.
 *
 * @public
 */
export function localePath(
  common: CommonComposableOptions,
  route: RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): string {
  // return external url as is
  if (typeof route === 'string' && hasProtocol(route, { acceptRelative: true })) {
    return route
  }

  const localizedRoute = resolveRoute(common, route, locale)
  return localizedRoute == null ? '' : localizedRoute.redirectedFrom?.fullPath || localizedRoute.fullPath
}

/**
 * Returns localized route for passed in `route` parameters.
 *
 * @remarks
 * If `locale` is not specified, uses current locale.
 *
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A route. if cannot resolve, `undefined` is returned.
 *
 * @public
 */
export function localeRoute(
  common: CommonComposableOptions,
  route: RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): ReturnType<Router['resolve']> | undefined {
  const resolved = resolveRoute(common, route, locale)
  return resolved ?? undefined
}

/**
 * Returns localized location for passed in route parameters.
 *
 * @remarks
 * If `locale` is not specified, uses current locale.
 *
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A route location. if cannot resolve, `undefined` is returned.
 *
 * @public
 */
export function localeLocation(
  common: CommonComposableOptions,
  route: RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): Location | (RouteLocation & { href: string }) | undefined {
  const resolved = resolveRoute(common, route, locale)
  return resolved ?? undefined
}

export function resolveRoute(common: CommonComposableOptions, route: RouteLocationRaw, locale: Locale | undefined) {
  const { router, i18n } = common
  const _locale = locale || getLocale(i18n)
  if (!_locale || _locale === 'undefined') {
    return null
  }
  const { strategy, routesNameSeparator, trailingSlash, customPages } = common.runtimeConfig.public.i18n
  let { defaultLocale } = common.runtimeConfig.public.i18n

  const lang = [...normalizedLocales].find(locale => locale.code === _locale)
  if (lang?.domain) {
    const defaultCode = lang?.code
    if (defaultCode && !!locale && strategy !== 'prefix') {
      defaultLocale = defaultCode.toString()
    }
  }

  const prefixable = extendPrefixable(common.runtimeConfig)
  // if route parameter is a string, check if it's a path or name of route.
  let _route: RouteLocationPathRaw | RouteLocationNamedRaw
  if (isString(route)) {
    if (route[0] === '/') {
      // if route parameter is a path, create route object with path.
      const { pathname: path, search, hash } = parsePath(route)
      const query = parseQuery(search)
      _route = { path, query, hash }
    } else {
      // else use it as route name.
      _route = { name: route }
    }
  } else {
    _route = route
  }

  let localizedRoute = assign(
    {} as (RouteLocationPathRaw & { params: any; name?: string }) | RouteLocationNamedRaw,
    _route
  )

  const isRouteLocationPathRaw = (val: RouteLocationPathRaw | RouteLocationNamedRaw): val is RouteLocationPathRaw =>
    'path' in val && !!val.path && !('name' in val)

  if (isRouteLocationPathRaw(localizedRoute)) {
    const resolvedRoute = resolve(common, localizedRoute, strategy, _locale)
    // @ts-ignore
    const resolvedRouteName = getRouteBaseName(common, resolvedRoute)
    if (isString(resolvedRouteName)) {
      localizedRoute = {
        name: getLocaleRouteName(resolvedRouteName, _locale, defaultLocale, routesNameSeparator, strategy),
        // @ts-ignore
        params: resolvedRoute.params,
        query: resolvedRoute.query,
        hash: resolvedRoute.hash
      } as RouteLocationNamedRaw

      if ((defaultLocale !== _locale && strategy !== 'no_prefix') || strategy === 'prefix') {
        // @ts-ignore
        localizedRoute.params = { ...localizedRoute.params, ...{ locale: _locale } }
      }

      // @ts-expect-error
      localizedRoute.state = (resolvedRoute as ResolveV4).state
    } else {
      // if route has a path defined but no name, resolve full route using the path
      if (prefixable({ currentLocale: _locale, defaultLocale, strategy })) {
        localizedRoute.path = `/${_locale}${localizedRoute.path}`
      }

      localizedRoute.path = trailingSlash
        ? withTrailingSlash(localizedRoute.path, true)
        : withoutTrailingSlash(localizedRoute.path, true)

      if ((defaultLocale !== _locale && strategy !== 'no_prefix') || strategy === 'prefix') {
        // @ts-ignore
        localizedRoute.params = { ...resolvedRoute.params, ...{ locale: _locale } }
      }
    }
  } else {
    if (!localizedRoute.name && !('path' in localizedRoute)) {
      localizedRoute.name = getRouteBaseName(common, router.currentRoute.value)
    }

    localizedRoute.name = getLocaleRouteName(localizedRoute.name, _locale, defaultLocale, routesNameSeparator, strategy)
    if ((defaultLocale !== _locale && strategy !== 'no_prefix') || strategy === 'prefix') {
      localizedRoute.params = { ...localizedRoute.params, ...{ locale: _locale } }
    }
  }

  try {
    if (localizedRoute.name) {
      const routeName = localizedRoute.name.toString() + routesNameSeparator + _locale
      const subLocalizedRoute = assign(
        {} as (RouteLocationPathRaw & { params: any; name?: string }) | RouteLocationNamedRaw,
        localizedRoute,
        {
          name: routeName
        }
      )

      if ((defaultLocale !== _locale && strategy !== 'no_prefix') || strategy === 'prefix') {
        subLocalizedRoute.params = { ...subLocalizedRoute.params, ...{ locale: _locale } }
      }

      const resolvedRoute = router.resolve(subLocalizedRoute)

      if (resolvedRoute.name) {
        return resolvedRoute
      }
    }
  } catch (e) {}

  try {
    let resolvedRoute = router.resolve(localizedRoute)
    if (resolvedRoute.path) {
      let checker = false
      for (const i in resolvedRoute.matched) {
        if (
          resolvedRoute.matched[i].meta &&
          resolvedRoute.matched[i].meta.locale &&
          checkLocale(resolvedRoute.path, resolvedRoute.matched[i].path)
        ) {
          checker = true
        }
      }
      if (!checker && localizedRoute.name) {
        localizedRoute.name = localizedRoute.name.toString().replace(`${routesNameSeparator}locale`, '')
        resolvedRoute = router.resolve(localizedRoute)
      }

      const parts = resolvedRoute.path.split('/')
      const routePath = parts.slice(2).join('/')

      const result = findValueByPath([routePath, _locale], customPages)
      if (result === null || result === false) {
        return null
      }
      if (result && _locale) {
        const localizedRoute = router.resolve({ path: '/' + _locale + result })
        // @ts-ignore
        localizedRoute.params = _route.params
        localizedRoute.query = (_route.query ?? {}) as LocationQuery
        localizedRoute.hash = _route.hash ?? ''

        if ((defaultLocale !== _locale && strategy !== 'no_prefix') || strategy === 'prefix') {
          localizedRoute.params = { ...localizedRoute.params, ...{ locale: _locale } }
        }

        return router.resolve(localizedRoute)
      }
    }
    if (resolvedRoute.name) {
      return resolvedRoute
    }

    // if didn't resolve to an existing route then just return resolved route based on original input.
    return router.resolve(route)
  } catch (e: unknown) {
    // `1` is No match
    if (typeof e === 'object' && 'type' in e! && e.type === 1) {
      return null
    }
  }
}

function checkLocale(path: string, pattern: string) {
  const localePatternMatch = pattern.match(/:locale\(([^)]+)\)/)
  if (!localePatternMatch) {
    return true
  }

  const allowedLocales = localePatternMatch[1].split('|')

  const localeRegex = new RegExp('^/' + allowedLocales.join('|') + '(?:/|$)')

  return localeRegex.test(path)
}

function findValueByPath(pathArray: string[], pagesObject: CustomRoutePages): string | undefined | null | false {
  let currentObject: any = pagesObject
  for (const key of pathArray) {
    if (currentObject[key] === undefined) {
      return undefined
    }
    currentObject = currentObject[key]
  }
  return currentObject
}

export const DefaultSwitchLocalePathIntercepter: SwitchLocalePathIntercepter = (path: string) => path

function getLocalizableMetaFromDynamicParams(
  common: CommonComposableOptions,
  route: RouteLocationNormalizedLoaded
): Record<Locale, Record<string, unknown>> {
  if (common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR) {
    return unref(common.metaState.value) as Record<Locale, any>
  }

  const meta = route.meta || {}
  return (unref(meta)?.[DEFAULT_DYNAMIC_PARAMS_KEY] || {}) as Record<Locale, any>
}

/**
 * Returns path of the current route for specified locale.
 *
 * @param locale - A locale
 *
 * @returns A path of the current route.
 *
 * @public
 */
export function switchLocalePath(
  common: CommonComposableOptions,
  locale: Locale,
  _route?: RouteLocationNormalized | RouteLocationNormalizedLoaded
): string {
  const route = _route ?? common.router.currentRoute.value
  const name = getRouteBaseName(common, route)

  if (!name) {
    return ''
  }

  const switchLocalePathIntercepter = extendSwitchLocalePathIntercepter(common.runtimeConfig)
  const routeCopy = routeToObject(route)
  const resolvedParams = getLocalizableMetaFromDynamicParams(common, route)[locale]

  const baseRoute = { ...routeCopy, name, params: { ...routeCopy.params, ...resolvedParams } }

  if (baseRoute.params) {
    delete baseRoute.params.locale
  }

  const path = localePath(common, baseRoute, locale)

  // custom locale path with interceptor
  return switchLocalePathIntercepter(path, locale)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { isString, assign } from '@intlify/shared'
import { parsePath, parseQuery, withTrailingSlash, withoutTrailingSlash } from 'ufo'
import { nuxtI18nOptions, DEFAULT_DYNAMIC_PARAMS_KEY } from '#build/i18n.options.mjs'
import { unref, useNuxtApp, useRoute, useRouter } from '#imports'

import { resolve, routeToObject } from './utils'
import { getComposer, getLocale, getLocaleRouteName, getRouteName } from '../utils'
import { extendPrefixable, extendSwitchLocalePathIntercepter } from '../../utils'

import type { Strategies, PrefixableOptions, SwitchLocalePathIntercepter } from '#build/i18n.options.mjs'
import type { Locale } from 'vue-i18n'
import type {
  RouteLocation,
  RouteLocationRaw,
  Router,
  RouteLocationPathRaw,
  RouteLocationNamedRaw,
  RouteLocationNormalizedLoaded,
  RouteLocationNormalized
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

 * @param givenRoute - A route.
 * 
 * @returns The route base name. if cannot get, `undefined` is returned.
 * 
 * @public
 */
export function getRouteBaseName(givenRoute?: RouteLocation): string | undefined {
  const { routesNameSeparator } = nuxtI18nOptions
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
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A path of the current route.
 *
 * @public
 */
export function localePath(
  route: RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): string {
  const localizedRoute = resolveRoute(route, locale)
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
  route: RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): ReturnType<Router['resolve']> | undefined {
  const resolved = resolveRoute(route, locale)
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
  route: RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): Location | (RouteLocation & { href: string }) | undefined {
  const resolved = resolveRoute(route, locale)
  return resolved ?? undefined
}

export function resolveRoute(route: RouteLocationRaw, locale?: Locale) {
  const router = useRouter()
  const i18n = getComposer(useNuxtApp().$i18n)
  const _locale = locale || getLocale(i18n)
  const { routesNameSeparator, defaultLocale, defaultLocaleRouteNameSuffix, strategy, trailingSlash } = nuxtI18nOptions
  const prefixable = extendPrefixable()
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

  let localizedRoute = assign({} as RouteLocationPathRaw | RouteLocationNamedRaw, _route)

  const isRouteLocationPathRaw = (val: RouteLocationPathRaw | RouteLocationNamedRaw): val is RouteLocationPathRaw =>
    'path' in val && !!val.path && !('name' in val)

  if (isRouteLocationPathRaw(localizedRoute)) {
    const resolvedRoute = resolve(localizedRoute, strategy, _locale)

    // @ts-ignore
    const resolvedRouteName = getRouteBaseName(resolvedRoute)
    if (isString(resolvedRouteName)) {
      localizedRoute = {
        name: getLocaleRouteName(resolvedRouteName, _locale, {
          defaultLocale,
          strategy,
          routesNameSeparator,
          defaultLocaleRouteNameSuffix
        }),
        // @ts-ignore
        params: resolvedRoute.params,
        query: resolvedRoute.query,
        hash: resolvedRoute.hash
      } as RouteLocationNamedRaw

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
    }
  } else {
    if (!localizedRoute.name && !('path' in localizedRoute)) {
      localizedRoute.name = getRouteBaseName(useRoute())
    }

    localizedRoute.name = getLocaleRouteName(localizedRoute.name, _locale, {
      defaultLocale,
      strategy,
      routesNameSeparator,
      defaultLocaleRouteNameSuffix
    })
  }

  try {
    const resolvedRoute = router.resolve(localizedRoute)
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

export const DefaultSwitchLocalePathIntercepter: SwitchLocalePathIntercepter = (path: string) => path

function getLocalizableMetaFromDynamicParams(
  route: RouteLocationNormalizedLoaded
): Record<Locale, Record<string, unknown>> {
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
  locale: Locale,
  _route?: RouteLocationNormalized | RouteLocationNormalizedLoaded
): string {
  const route = _route ?? useRoute()
  const name = getRouteBaseName(route)

  if (!name) {
    return ''
  }

  const switchLocalePathIntercepter = extendSwitchLocalePathIntercepter()
  const routeCopy = routeToObject(route)
  const resolvedParams = getLocalizableMetaFromDynamicParams(route)[locale]

  const baseRoute = { ...routeCopy, name, params: { ...routeCopy.params, ...resolvedParams } }
  const path = localePath(baseRoute, locale)

  // custom locale path with interceptor
  return switchLocalePathIntercepter(path, locale)
}

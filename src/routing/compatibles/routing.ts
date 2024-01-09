import { isString, assign } from '@intlify/shared'
import {
  type Route,
  type RawLocation,
  type RouteLocationRaw,
  type RouteLocationNormalizedLoaded,
  type Router,
  type RouteMeta,
  type RouteLocationNamedRaw,
  type RouteLocationPathRaw,
  type RouteLocation,
  type Location
} from '@intlify/vue-router-bridge'
import { parsePath, parseQuery, withTrailingSlash, withoutTrailingSlash } from 'ufo'

import { DEFAULT_DYNAMIC_PARAMS_KEY } from '../../constants'
import { getLocale } from 'vue-i18n-routing'

import { resolve, routeToObject } from './utils'

import type { PrefixableOptions, SwitchLocalePathIntercepter } from './types'
import type { Strategies, I18nRoutingOptions } from '../types'
import { nuxtI18nInternalOptions, nuxtI18nOptions } from '#build/i18n.options.mjs'
import { isRef, unref } from 'vue'
import { getComposer, getLocaleRouteName, getRouteName } from '../utils'
import type { Locale } from 'vue-i18n'
import { useNuxtApp } from 'nuxt/app'
import { useRoute, useRouter } from 'vue-router'
import { extendPrefixable, extendSwitchLocalePathIntercepter } from '../../runtime/utils'

const RESOLVED_PREFIXED = new Set<Strategies>(['prefix_and_default', 'prefix_except_default'])

function prefixable(optons: PrefixableOptions): boolean {
  const { currentLocale, defaultLocale, strategy } = optons
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
  route: RawLocation | RouteLocationRaw,
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
  route: RawLocation | RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): Route | ReturnType<Router['resolve']> | undefined {
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
  route: RawLocation | RouteLocationRaw,
  locale?: Locale // TODO: locale should be more type inference (completion)
): Location | (RouteLocation & { href: string }) | undefined {
  const resolved = resolveRoute(route, locale)
  return resolved ?? undefined
}

export function resolveRoute(route: RawLocation | RouteLocationRaw, locale?: Locale) {
  const router = useRouter()
  const i18n = getComposer(useNuxtApp().$i18n)
  const _locale = locale || getLocale(i18n)
  const { routesNameSeparator, defaultLocale, defaultLocaleRouteNameSuffix, strategy, trailingSlash } = nuxtI18nOptions
  const prefixable = extendPrefixable(nuxtI18nOptions.differentDomains)
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
  route: Route | RouteLocationNormalizedLoaded,
  key: Required<I18nRoutingOptions>['dynamicRouteParamsKey']
): Record<Locale, unknown> {
  const metaDefault = {}
  if (key === DEFAULT_DYNAMIC_PARAMS_KEY) {
    return metaDefault
  }

  const meta = (route as RouteLocationNormalizedLoaded).meta || metaDefault

  if (isRef<RouteMeta>(meta)) {
    return (meta.value[key] || metaDefault) as Record<Locale, unknown>
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((meta as any)[key] || metaDefault) as Record<Locale, unknown>
  }
}

export type MetaDynamicParamsInterceptor = (
  route: Route | RouteLocationNormalizedLoaded,
  key: Required<I18nRoutingOptions>['dynamicRouteParamsKey']
) => Record<Locale, unknown>

/**
 * Returns path of the current route for specified locale.
 *
 * @param locale - A locale
 *
 * @returns A path of the current route.
 *
 * @public
 */
export function switchLocalePath(locale: Locale): string {
  const route = useRoute()
  const name = getRouteBaseName(route)
  if (!name) {
    return ''
  }

  const dynamicRouteParamsKey = 'nuxtI18n'

  const { __normalizedLocales: normalizedLocales } = nuxtI18nInternalOptions
  const switchLocalePathIntercepter = extendSwitchLocalePathIntercepter(
    nuxtI18nOptions.differentDomains,
    normalizedLocales
  )
  const dynamicParamsInterceptor = () => ({ value: undefined })
  const routeValue = route as RouteLocationNormalizedLoaded // for vue-router v4
  const routeCopy = routeToObject(routeValue)
  const langSwitchParamsIntercepted = dynamicParamsInterceptor?.()?.value?.[locale]
  const langSwitchParams = getLocalizableMetaFromDynamicParams(route, dynamicRouteParamsKey)[locale] || {}

  const resolvedParams = langSwitchParamsIntercepted ?? langSwitchParams ?? {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _baseRoute: any = {
    name,
    params: {
      ...routeCopy.params,
      ...resolvedParams
    }
  }

  const baseRoute = assign({}, routeCopy, _baseRoute)
  let path = localePath(baseRoute, locale)

  // custom locale path with interceptor
  path = switchLocalePathIntercepter(path, locale)

  return path
}

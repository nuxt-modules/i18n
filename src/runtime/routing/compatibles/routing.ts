/* eslint-disable @typescript-eslint/no-explicit-any */
import { hasProtocol, parsePath, parseQuery, withTrailingSlash, withoutTrailingSlash } from 'ufo'
import { DEFAULT_DYNAMIC_PARAMS_KEY } from '#build/i18n.options.mjs'
import { unref } from '#imports'

import { getI18nTarget } from '../../compatibility'
import { getLocaleRouteName, getRouteName } from '../utils'
import { extendPrefixable, extendSwitchLocalePathIntercepter, type CommonComposableOptions } from '../../utils'

import type { Strategies } from '#internal-i18n-types'
import type { Locale } from 'vue-i18n'
import type { RouteLocation, RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw } from 'vue-router'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from '../../types'

/**
 * Returns base name of current (if argument not provided) or passed in route.
 *
 * @remarks
 * Base name is name of the route without locale suffix and other metadata added by nuxt i18n module
 */
export function getRouteBaseName(common: CommonComposableOptions, route?: RouteLocation): string | undefined {
  const _route = unref(route)
  if (_route == null || !_route.name) {
    return
  }
  const name = getRouteName(_route.name)
  return name.split(common.runtimeConfig.public.i18n.routesNameSeparator)[0]
}

/**
 * Resolves a localized path of the passed in route.
 */
export function localePath(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale): string {
  // return external url as is
  if (typeof route === 'string' && hasProtocol(route, { acceptRelative: true })) {
    return route
  }

  const localizedRoute = resolveRoute(common, route, locale)
  return localizedRoute == null ? '' : localizedRoute.redirectedFrom?.fullPath || localizedRoute.fullPath
}

/**
 * Resolves a localized variant of the passed route.
 */
export function localeRoute(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale) {
  const resolved = resolveRoute(common, route, locale)
  return resolved ?? undefined
}

export function resolveRoute(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale) {
  const _locale = locale || unref(getI18nTarget(common.i18n).locale)
  const { defaultLocale, strategy, trailingSlash } = common.runtimeConfig.public.i18n as I18nPublicRuntimeConfig
  const prefixable = extendPrefixable(common.runtimeConfig)
  // if route parameter is a string, check if it's a path or name of route.
  let _route: RouteLocationPathRaw | RouteLocationNamedRaw
  if (typeof route === 'string') {
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

  let localizedRoute = Object.assign({} as RouteLocationPathRaw | RouteLocationNamedRaw, _route)

  const isRouteLocationPathRaw = (val: RouteLocationPathRaw | RouteLocationNamedRaw): val is RouteLocationPathRaw =>
    'path' in val && !!val.path && !('name' in val)

  if (isRouteLocationPathRaw(localizedRoute)) {
    const resolvedRoute = resolve(common, localizedRoute, strategy, _locale)

    // @ts-ignore
    const resolvedRouteName = getRouteBaseName(common, resolvedRoute)
    if (typeof resolvedRouteName === 'string') {
      localizedRoute = {
        name: getLocaleRouteName(resolvedRouteName, _locale, common.runtimeConfig.public.i18n),
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- FIXME
        params: resolvedRoute.params,
        query: resolvedRoute.query,
        hash: resolvedRoute.hash
      } as RouteLocationNamedRaw

      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- FIXME
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
      localizedRoute.name = getRouteBaseName(common, common.router.currentRoute.value)
    }

    localizedRoute.name = getLocaleRouteName(localizedRoute.name, _locale, common.runtimeConfig.public.i18n)
  }

  try {
    const resolvedRoute = common.router.resolve(localizedRoute)
    if (resolvedRoute.name) {
      return resolvedRoute
    }

    // if didn't resolve to an existing route then just return resolved route based on original input.
    return common.router.resolve(route)
  } catch (e: unknown) {
    // `1` is No match
    if (typeof e === 'object' && 'type' in e! && e.type === 1) {
      return null
    }
  }
}

function getLocalizableMetaFromDynamicParams(
  common: CommonComposableOptions,
  route: CompatRoute
): Record<Locale, Record<string, unknown>> {
  if (common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR) {
    return unref(common.metaState.value)
  }

  const meta = route.meta || {}
  return (unref(meta)?.[DEFAULT_DYNAMIC_PARAMS_KEY] || {}) as Record<Locale, any>
}

/**
 * Resolve the localized path of the current route.
 */
export function switchLocalePath(common: CommonComposableOptions, locale: Locale, _route?: CompatRoute): string {
  const route = _route ?? common.router.currentRoute.value
  const name = getRouteBaseName(common, route)

  if (!name) {
    return ''
  }

  const switchLocalePathIntercepter = extendSwitchLocalePathIntercepter(common.runtimeConfig)
  const resolvedParams = getLocalizableMetaFromDynamicParams(common, route)[locale]

  /**
   * NOTE:
   * Nuxt route uses a proxy with getters for performance reasons (https://github.com/nuxt/nuxt/pull/21957).
   * Spreading will result in an empty object, so we make a copy of the route by accessing each getter property by name.
   */
  const routeCopy = {
    name,
    params: { ...route.params, ...resolvedParams },
    fullPath: route.fullPath,
    query: route.query,
    hash: route.hash,
    path: route.path,
    meta: route.meta
    // matched: route.matched,
    // redirectedFrom: route.redirectedFrom
  }

  const path = localePath(common, routeCopy, locale)

  // custom locale path with interceptor
  return switchLocalePathIntercepter(path, locale)
}

/**
 * NOTE:
 * vue-router v4.x `router.resolve` will output warnings for non existent paths and `router.hasRoute` only accepts named routes.
 * When using the `prefix` strategy, the path passed to `localePath` will not be prefixed with a locale.
 * This will cause vue-router to issue a warning, so we can work-around by using `router.options.routes`.
 */
function resolve(common: CommonComposableOptions, route: RouteLocationPathRaw, strategy: Strategies, locale: Locale) {
  if (strategy !== 'prefix') {
    return common.router.resolve(route)
  }

  // if (isArray(route.matched) && route.matched.length > 0) {
  //   return route.matched[0]
  // }

  const restPath = route.path.slice(1)
  const targetPath = route.path[0] + locale + (restPath && '/' + restPath)
  const _route = common.router.options.routes.find(r => r.path === targetPath)

  if (_route == null) {
    return route
  }

  return common.router.resolve({ ...route, ..._route, path: targetPath })
}

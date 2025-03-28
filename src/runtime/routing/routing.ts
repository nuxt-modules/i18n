import { hasProtocol, joinURL, parsePath, parseQuery, withTrailingSlash, withoutTrailingSlash } from 'ufo'
import { DEFAULT_DYNAMIC_PARAMS_KEY } from '#build/i18n.options.mjs'
import { isNavigationFailure } from 'vue-router'
import { unref } from '#imports'

import { getI18nTarget } from '../compatibility'
import { getDomainFromLocale } from '../internal'
import { getLocaleRouteName, getRouteName } from './utils'
import { prefixable, type CommonComposableOptions } from '../utils'

import type { Locale } from 'vue-i18n'
import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw, RouteMap } from 'vue-router'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute, RouteLocationGenericPath } from '../types'

/**
 * Returns base name of current (if argument not provided) or passed in route.
 *
 * @remarks
 * Base name is name of the route without locale suffix and other metadata added by nuxt i18n module
 */
export function getRouteBaseName<Name extends keyof RouteMap = keyof RouteMap>(
  common: CommonComposableOptions,
  route: Name | RouteLocationGenericPath | null
) {
  const _route = unref(route)
  const routeName = typeof _route === 'object' ? _route?.name : _route
  if (_route == null || !routeName) {
    return
  }
  const name = getRouteName(routeName)
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
  return resolveRoute(common, route, locale) ?? undefined
}

type RouteLike = (RouteLocationPathRaw & { name?: string }) | (RouteLocationNamedRaw & { path?: string })

/**
 * Copy and normalizes a raw route argument into a `RouteLike` object
 */
function normalizeRawLocation(route: RouteLocationRaw): RouteLike {
  // return a copy of the object
  if (typeof route !== 'string') {
    return Object.assign({}, route)
  }

  // route path
  if (route[0] === '/') {
    const { pathname: path, search, hash } = parsePath(route)
    return { path, query: parseQuery(search), hash }
  }

  // route name
  return { name: route }
}

const isRouteLocationPathRaw = (val: RouteLike): val is RouteLocationPathRaw => !!val.path && !val.name

/**
 * Prepares a route object to be resolved as a localized route
 */
function resolveRouteObject(common: CommonComposableOptions, route: RouteLike, locale: Locale) {
  const runtimeI18n = common.runtimeConfig.public.i18n as I18nPublicRuntimeConfig

  if (isRouteLocationPathRaw(route)) {
    const resolved = resolve(common, route, locale) as RouteLike
    const resolvedName = getRouteBaseName(common, resolved)
    if (resolvedName) {
      resolved.name = getLocaleRouteName(resolvedName, locale, runtimeI18n)
      return resolved
    }

    // if route has a path defined but no name, resolve full route using the path
    if (!runtimeI18n.differentDomains && prefixable(locale, runtimeI18n.defaultLocale, runtimeI18n.strategy)) {
      route.path = '/' + locale + route.path
    }

    route.path = (runtimeI18n.trailingSlash ? withTrailingSlash : withoutTrailingSlash)(route.path, true)

    return route
  }

  // if name is falsy fallback to current route name
  route.name ||= getRouteBaseName(common, common.router.currentRoute.value)

  const localizedName = getLocaleRouteName(route.name, locale, runtimeI18n)
  // route localization may be disabled, check if localized variant exists
  if (common.router.hasRoute(localizedName)) {
    route.name = localizedName
  }

  return route
}

export function resolveRoute(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale) {
  try {
    const _locale = locale || unref(getI18nTarget(common.i18n).locale)
    const normalized = normalizeRawLocation(route)
    const resolved = common.router.resolve(resolveRouteObject(common, normalized, _locale))
    if (resolved.name) {
      return resolved
    }

    // if didn't resolve to an existing route then just return resolved route based on original input.
    return common.router.resolve(route)
  } catch (e: unknown) {
    if (isNavigationFailure(e, 1 /* No match */)) {
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
  return (unref(meta)?.[DEFAULT_DYNAMIC_PARAMS_KEY] || {}) as Record<Locale, never>
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

  const resolvedParams = getLocalizableMetaFromDynamicParams(common, route)[locale]

  /**
   * NOTE:
   * Nuxt route uses a proxy with getters for performance reasons (https://github.com/nuxt/nuxt/pull/21957).
   * Spreading will result in an empty object, so we make a copy of the route by accessing each getter property by name.
   */
  const routeCopy = {
    name,
    params: Object.assign({}, route.params, resolvedParams),
    fullPath: route.fullPath,
    query: route.query,
    hash: route.hash,
    path: route.path,
    meta: route.meta
    // matched: route.matched,
    // redirectedFrom: route.redirectedFrom
  }

  const path = localePath(common, routeCopy, locale)

  // custom locale path for domains
  if (common.runtimeConfig.public.i18n.differentDomains) {
    const domain = getDomainFromLocale(locale)
    return (domain && joinURL(domain, path)) || path
  }

  return path
}

/**
 * NOTE:
 * vue-router v4.x `router.resolve` will output warnings for non existent paths and `router.hasRoute` only accepts named routes.
 * When using the `prefix` strategy, the path passed to `localePath` will not be prefixed with a locale.
 * This will cause vue-router to issue a warning, so we can work-around by using `router.options.routes`.
 */
function resolve(common: CommonComposableOptions, route: RouteLocationPathRaw, locale: Locale) {
  if (common.runtimeConfig.public.i18n.strategy === 'no_prefix') {
    return route
  }

  if (common.runtimeConfig.public.i18n.strategy !== 'prefix') {
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

  return common.router.resolve(Object.assign({}, route, _route, { path: targetPath }))
}

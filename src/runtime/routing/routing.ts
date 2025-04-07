import { hasProtocol, parsePath, parseQuery } from 'ufo'
import { assign, isString } from '@intlify/shared'

import type { CommonComposableOptions } from '../utils'

import type { Locale } from 'vue-i18n'
import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw } from 'vue-router'
import type { CompatRoute } from '../types'

export type RouteLikeWithPath = RouteLocationPathRaw & { name?: string }
export type RouteLikeWithName = RouteLocationNamedRaw & { path?: string }
export type RouteLike = RouteLikeWithPath | RouteLikeWithName

/**
 * Resolves a localized path of the passed in route.
 */
export function localePath(
  common: Pick<CommonComposableOptions, 'resolveLocalizedRouteObject' | 'router' | 'getLocale'>,
  route: RouteLocationRaw,
  locale: Locale = common.getLocale()
): string {
  // return external url as is
  if (isString(route) && hasProtocol(route, { acceptRelative: true })) {
    return route
  }

  try {
    const localizedRoute = resolveRoute(common, route, locale)
    return localizedRoute?.redirectedFrom?.fullPath || localizedRoute.fullPath
  } catch {
    return ''
  }
}

/**
 * Resolves a localized variant of the passed route.
 */
export function localeRoute(
  common: Pick<CommonComposableOptions, 'resolveLocalizedRouteObject' | 'router' | 'getLocale'>,
  route: RouteLocationRaw,
  locale?: Locale
) {
  return tryResolveRoute(common, route, locale)
}

/**
 * Copy and normalizes a raw route argument into a `RouteLike` object
 */
function normalizeRawLocation(route: RouteLocationRaw): RouteLike {
  // return a copy of the object
  if (!isString(route)) {
    return assign({}, route)
  }

  // route path
  if (route[0] === '/') {
    const { pathname: path, search, hash } = parsePath(route)
    return { path, query: parseQuery(search), hash }
  }

  // route name
  return { name: route }
}

/**
 * Try resolving route and throw on failure
 */
function resolveRoute(
  common: Pick<CommonComposableOptions, 'resolveLocalizedRouteObject' | 'router'>,
  route: RouteLocationRaw,
  locale: Locale
) {
  const normalized = normalizeRawLocation(route)
  const resolved = common.router.resolve(common.resolveLocalizedRouteObject(normalized, locale))
  if (resolved.name) {
    return resolved
  }

  // if unable to resolve route try resolving route based on original input
  return common.router.resolve(route)
}

/**
 * Try resolving route and return undefined on failure
 */
function tryResolveRoute(
  common: Pick<CommonComposableOptions, 'resolveLocalizedRouteObject' | 'router' | 'getLocale'>,
  route: RouteLocationRaw,
  locale: Locale = common.getLocale()
) {
  try {
    return resolveRoute(common, route, locale)
  } catch (_) {
    return
  }
}

/**
 * Resolve the localized path of the current route.
 */
export function switchLocalePath(
  common: CommonComposableOptions,
  locale: Locale,
  route: CompatRoute = common.router.currentRoute.value
): string {
  const name = common.getRouteBaseName(route)

  // unable to localize nameless path
  if (!name) {
    return ''
  }

  /**
   * Nuxt route uses a proxy with getters for performance reasons (https://github.com/nuxt/nuxt/pull/21957).
   * Spreading will result in an empty object, so we make a copy of the route by accessing each getter property by name.
   * We skip the `matched` and `redirectedFrom` properties.
   */
  const routeCopy = {
    name,
    params: assign({}, route.params, common.getLocalizedDynamicParams(locale)),
    fullPath: route.fullPath,
    query: route.query,
    hash: route.hash,
    path: route.path,
    meta: route.meta
  }

  const path = localePath(common, routeCopy, locale)
  // custom locale path for domains
  return common.afterSwitchLocalePath(path, locale)
}

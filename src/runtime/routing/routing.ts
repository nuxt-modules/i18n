import { hasProtocol, parsePath, parseQuery } from 'ufo'
import { assign, isString } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { RouteLocationRaw, RouteLocationPathRaw, RouteLocationNamedRaw } from 'vue-router'
import type { CompatRoute } from '../types'
import type { ComposableContext } from '../utils'

export type RouteLikeWithPath = RouteLocationPathRaw & { name?: string }
export type RouteLikeWithName = RouteLocationNamedRaw & { path?: string }
export type RouteLike = RouteLikeWithPath | RouteLikeWithName

/**
 * Resolves a localized path of the passed in route.
 */
export function localePath(ctx: ComposableContext, route: RouteLocationRaw, locale: Locale = ctx.getLocale()): string {
  // return external url as is
  if (isString(route) && hasProtocol(route, { acceptRelative: true })) {
    return route
  }

  try {
    const localizedRoute = resolveRoute(ctx, route, locale)
    return localizedRoute?.redirectedFrom?.fullPath || localizedRoute.fullPath
  } catch {
    return ''
  }
}

/**
 * Resolves a localized variant of the passed route.
 */
export function localeRoute(ctx: ComposableContext, route: RouteLocationRaw, locale: Locale = ctx.getLocale()) {
  try {
    return resolveRoute(ctx, route, locale)
  } catch (_) {
    return
  }
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
function resolveRoute(ctx: ComposableContext, route: RouteLocationRaw, locale: Locale) {
  const normalized = normalizeRawLocation(route)
  const resolved = ctx.router.resolve(ctx.resolveLocalizedRouteObject(normalized, locale))
  if (resolved.name) {
    return resolved
  }

  // if unable to resolve route try resolving route based on original input
  return ctx.router.resolve(route)
}

/**
 * Resolve the localized path of the current route.
 */
export function switchLocalePath(
  ctx: ComposableContext,
  locale: Locale,
  route: CompatRoute = ctx.router.currentRoute.value
): string {
  const name = ctx.getRouteBaseName(route)
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
    params: assign({}, route.params, ctx.getLocalizedDynamicParams(locale)),
    fullPath: route.fullPath,
    query: route.query,
    hash: route.hash,
    path: route.path,
    meta: route.meta
  }

  const path = localePath(ctx, routeCopy, locale)
  // custom locale path for domains
  return ctx.afterSwitchLocalePath(path, locale)
}

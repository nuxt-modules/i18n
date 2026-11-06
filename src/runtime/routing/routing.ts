import { hasProtocol, parsePath, parseQuery } from 'ufo'
import { assign, isString } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { RouteLocationNamedRaw, RouteLocationPathRaw, RouteLocationRaw } from 'vue-router'
import type { CompatRoute } from '../types'
import type { RoutingContext } from './context'

export type RouteLikeWithPath = RouteLocationPathRaw & { name?: string }
export type RouteLikeWithName = RouteLocationNamedRaw & { path?: string }
export type RouteLike = RouteLikeWithPath | RouteLikeWithName

/**
 * Resolves a localized path of the passed in route.
 */
export function localePath(ctx: RoutingContext, route: RouteLocationRaw, locale: Locale = ctx.getLocale()): string {
  // return external url as is
  if (isString(route) && hasProtocol(route, { acceptRelative: true })) {
    return route
  }

  try {
    return resolveRoute(ctx, route, locale).fullPath
  } catch {
    return ''
  }
}

/**
 * Resolves a localized variant of the passed route.
 */
export function localeRoute(ctx: RoutingContext, route: RouteLocationRaw, locale: Locale = ctx.getLocale()) {
  try {
    return resolveRoute(ctx, route, locale)
  } catch {
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
 * `resolveLocalizedRouteObject` may return an already-resolved route (its `path`
 * decoded for readability, e.g. `%20` becomes a literal space — see `context.ts`
 * `resolveLocalizedRouteByPath`). Resolving that object a second time below re-parses
 * `path` as a fresh location string, so a literal '#' or '?' left over from decoding is
 * read as an actual fragment/query delimiter instead of path text, silently truncating
 * the path — `query`/`hash` are unaffected, populated separately and not re-parsed.
 * Only `path` (and the `fullPath`/`href` strings built from it) need the fix; re-escape
 * both characters and recompute `href` the same way vue-router derives it from `fullPath`.
 */
function sanitizeResolvedPath<T extends { path: string, fullPath: string, href?: string }>(
  ctx: RoutingContext,
  resolved: T,
): T {
  if (!/[#?]/.test(resolved.path)) {
    return resolved
  }

  const suffix = resolved.fullPath.slice(resolved.path.length)
  resolved.path = resolved.path.replace(/#/g, '%23').replace(/\?/g, '%3F')
  resolved.fullPath = resolved.path + suffix
  if (resolved.href !== undefined) {
    resolved.href = ctx.router.options.history.createHref(resolved.fullPath)
  }
  return resolved
}

/**
 * Try resolving route and throw on failure
 */
function resolveRoute(ctx: RoutingContext, route: RouteLocationRaw, locale: Locale) {
  const normalized = normalizeRawLocation(route)
  const localized = ctx.resolveLocalizedRouteObject(normalized, locale)
  // the matcher ignores `path` when `name` is set, but its presence makes `router.resolve()` take
  // its path branch, which skips `encodeParams()` and decodes escapes into delimiters (#4079, #4098)
  if (localized.name) {
    localized.path = undefined
  }
  const resolved = ctx.router.resolve(localized)
  if (resolved.name) {
    return sanitizeResolvedPath(ctx, resolved)
  }

  // if unable to resolve route try resolving route based on original input
  return sanitizeResolvedPath(ctx, ctx.router.resolve(route))
}

/**
 * Resolve the localized path of the current route.
 */
export function switchLocalePath(
  ctx: RoutingContext,
  locale: Locale,
  route: CompatRoute = ctx.router.currentRoute.value,
): string {
  const name = ctx.getRouteBaseName(route)
  // unable to localize nameless path
  if (!name) {
    return ''
  }

  /**
   * Nuxt route uses a proxy with getters for performance reasons (https://github.com/nuxt/nuxt/pull/21957).
   * Spreading will result in an empty object, so we make a copy of the route by accessing each getter property by name.
   * We skip the `matched`, `redirectedFrom` and `path` properties.
   */
  const routeCopy = {
    name,
    params: assign(
      {},
      route.params,
      ctx.getLocalizedDynamicParams(locale),
    ),
    fullPath: route.fullPath,
    query: route.query,
    hash: route.hash,
    meta: route.meta,
  }

  const path = localePath(ctx, routeCopy, locale)
  // custom locale path for domains
  return ctx.afterSwitchLocalePath(path, locale)
}

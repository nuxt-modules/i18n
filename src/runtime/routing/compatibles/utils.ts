import { assign } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { RouteLocationNormalizedLoaded, RouteLocationPathRaw } from 'vue-router'
import type { Strategies } from '#build/i18n.options.mjs'
import type { CommonComposableOptions } from '../../utils'

function split(str: string, index: number) {
  const result = [str.slice(0, index), str.slice(index)]
  return result
}

/**
 * NOTE:
 * Nuxt route uses a proxy with getters for performance reasons (https://github.com/nuxt/nuxt/pull/21957).
 * Spreading will result in an empty object, so we make a copy of the route by accessing each getter property by name.
 */
export function routeToObject(route: RouteLocationNormalizedLoaded) {
  const { fullPath, query, hash, name, path, params, meta, redirectedFrom, matched } = route
  return {
    fullPath,
    params,
    query,
    hash,
    name,
    path,
    meta,
    matched,
    redirectedFrom
  }
}

/**
 * NOTE:
 * vue-router v4.x `router.resolve` for a non exists path will output a warning.
 * `router.hasRoute`, which checks for the route can only be a named route.
 * When using the `prefix` strategy, the path specified by `localePath` is specified as a path not prefixed with a locale.
 * This will cause vue-router to issue a warning, so we can work-around by using `router.options.routes`.
 */
export function resolve(
  route: RouteLocationPathRaw,
  strategy: Strategies,
  locale: Locale,
  { router }: CommonComposableOptions
) {
  if (strategy !== 'prefix') {
    return router.resolve(route)
  }

  // if (isArray(route.matched) && route.matched.length > 0) {
  //   return route.matched[0]
  // }

  const [rootSlash, restPath] = split(route.path, 1)
  const targetPath = `${rootSlash}${locale}${restPath === '' ? restPath : `/${restPath}`}`
  const _route = router.options?.routes?.find(r => r.path === targetPath)

  if (_route == null) {
    return route
  }

  const _resolvableRoute = assign({}, route, _route)
  _resolvableRoute.path = targetPath
  return router.resolve(_resolvableRoute)
}

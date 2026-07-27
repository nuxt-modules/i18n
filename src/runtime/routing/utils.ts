import { assign } from '@intlify/shared'
import { getLocalizedRouteName, normalizeRouteName } from '#i18n-kit/routing'

import type { Locale } from 'vue-i18n'
import type { RouteLocationPathRaw, RouteLocationResolvedGeneric, RouteRecordNameGeneric, Router } from 'vue-router'
import type { PrefixableOptions } from '#i18n-kit/routing'

/**
 * Returns a getter function which returns a localized route name for the given route and locale,
 * resolved against the routes that were generated rather than from the strategy.
 */
export function createLocaleRouteNameGetter(
  hasRoute: (name: string) => boolean,
  config: Pick<PrefixableOptions, 'routing' | 'domains'>,
): (name: RouteRecordNameGeneric | null, locale: string) => string {
  // no route localization
  if (!config.routing && !config.domains) {
    return routeName => normalizeRouteName(routeName)
  }

  return (name, locale) => {
    const normalized = normalizeRouteName(name)
    // which locales get an unprefixed `___default` variant is decided by the strategy at build
    // time and pruned per host by `setupMultiDomainLocales`, so the route table is the authority
    const suffixed = getLocalizedRouteName(normalized, locale, true)
    return hasRoute(suffixed) ? suffixed : getLocalizedRouteName(normalized, locale, false)
  }
}

/**
 * Factory function which returns a resolver function based on the routing strategy.
 */
export function createLocalizedRouteByPathResolver(
  router: Router,
  config: PrefixableOptions,
): (route: RouteLocationPathRaw, locale: Locale) => RouteLocationPathRaw | RouteLocationResolvedGeneric {
  if (!config.routing) {
    return route => route
  }

  if (config.strategy === 'prefix') {
    /**
     * The `router.resolve` function prints warnings when resolving non-existent paths and `router.hasRoute` only accepts named routes.
     * The path passed to `localePath` is not prefixed which will trigger vue-router warnings since all routes are prefixed.
     * We work around this by manually prefixing the path and finding the route in `router.options.routes`.
     */
    return (route, locale) => {
      const targetPath = '/' + locale + (route.path === '/' ? '' : route.path)

      // Exact path match for per-locale routes
      const _route = router.options.routes.find(r => r.path === targetPath)
      if (_route != null) {
        return router.resolve(assign({}, route, _route, { path: targetPath }))
      }

      // For compact routes, the regex pattern (e.g. /:locale(en|ja)/path/:param)
      // won't have an exact match above. Return the original route — downstream
      // resolveLocalizedRouteByPath will add the prefix and router.resolve will
      // match the compact route using path-based resolution (preserving URL encoding).
      return route
    }
  }

  // strategy is prefix_except_default or prefix_and_default
  return route => router.resolve(route)
}

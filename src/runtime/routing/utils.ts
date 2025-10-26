import { assign } from '@intlify/shared'
import { getLocalizedRouteName, normalizeRouteName } from '#i18n-kit/routing'

import type { Locale } from 'vue-i18n'
import type { RouteLocationPathRaw, RouteLocationResolvedGeneric, RouteRecordNameGeneric, Router } from 'vue-router'

/**
 * Returns a getter function which returns a localized route name for the given route and locale.
 * The returned function can vary based on the strategy and domain configuration.
 */
export function createLocaleRouteNameGetter(
  defaultLocale: string,
): (name: RouteRecordNameGeneric | null, locale: string) => string {
  // no route localization
  if (!__I18N_ROUTING__ && !__DIFFERENT_DOMAINS__) {
    return routeName => normalizeRouteName(routeName)
  }

  // default locale routes have default suffix
  if (__I18N_STRATEGY__ === 'prefix_and_default') {
    return (name, locale) => getLocalizedRouteName(normalizeRouteName(name), locale, locale === defaultLocale)
  }

  // routes are localized
  return (name, locale) => getLocalizedRouteName(normalizeRouteName(name), locale, false)
}

/**
 * Factory function which returns a resolver function based on the routing strategy.
 */
export function createLocalizedRouteByPathResolver(
  router: Router,
): (route: RouteLocationPathRaw, locale: Locale) => RouteLocationPathRaw | RouteLocationResolvedGeneric {
  if (!__I18N_ROUTING__) {
    return route => route
  }

  if (__I18N_STRATEGY__ === 'prefix') {
    /**
     * The `router.resolve` function prints warnings when resolving non-existent paths and `router.hasRoute` only accepts named routes.
     * The path passed to `localePath` is not prefixed which will trigger vue-router warnings since all routes are prefixed.
     * We work around this by manually prefixing the path and finding the route in `router.options.routes`.
     */
    return (route, locale) => {
      const targetPath = '/' + locale + (route.path === '/' ? '' : route.path)
      const _route = router.options.routes.find(r => r.path === targetPath)

      if (_route == null) {
        return route
      }

      return router.resolve(assign({}, route, _route, { path: targetPath }))
    }
  }

  // strategy is prefix_except_default or prefix_and_default
  return route => router.resolve(route)
}

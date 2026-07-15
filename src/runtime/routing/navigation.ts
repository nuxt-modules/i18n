import { isEqual } from 'ufo'
import { getLocalizedRouteName, getRouteBaseName } from '#i18n-kit/routing'

import type { Strategies } from '#internal-i18n-types'
import type { CompatRoute } from '../types'

export type NavigationResolverConfig = {
  rootRedirect?: { path: string, code: number }
  redirectStatusCode?: number
  /** Resolves a localized path, e.g. `localePath` */
  localePath: (to: string, locale: string) => string
  /** Resolves the localized variant of the route, e.g. `switchLocalePath` */
  switchLocalePath: (locale: string, to: CompatRoute) => string
  /** Locale detected from the route path/name */
  routeLocale: (to: CompatRoute) => string | undefined
  hasRoute: (name: string) => boolean
  getLocaleCodes: () => string[]
  strategy: Strategies
  compactRoutes: boolean
}

export type ResolvedNavigation = { path: string, code: number | undefined }

export function createNavigationResolver(config: NavigationResolverConfig) {
  const { strategy, compactRoutes } = config

  /**
   * Routes with localization disabled (e.g. `definePageMeta({ i18n: false })`) keep their
   * unsuffixed record name and have no localized variants, unlike compact routes and
   * unprefixed fallback routes (e.g. the root route kept for `strategy: 'prefix'`).
   */
  function isUnlocalizedRoute(to: CompatRoute): boolean {
    if (strategy === 'no_prefix' || to.name == null) { return false }
    const name = String(to.name)
    if (getRouteBaseName(name) !== name) { return false }
    if (compactRoutes && to.matched.some(r => r.meta.__i18nCompact)) { return false }
    return !config.getLocaleCodes().some(code => config.hasRoute(getLocalizedRouteName(name, code, false)))
  }

  return function resolveNavigation(to: CompatRoute, locale: string, pendingLocale = false): ResolvedNavigation | undefined {
    if (to.path === '/' && config.rootRedirect) {
      return { path: config.localePath(config.rootRedirect.path, locale), code: config.rootRedirect.code }
    }

    // skip - localization disabled for route (#3987)
    if (isUnlocalizedRoute(to)) { return }

    // skip - pending locale inside navigation middleware
    if (pendingLocale) { return }

    // skip - redirection optional prevents prefix removal, reconsider if needed (#2288)
    if (config.routeLocale(to) === locale) { return }

    // skip redirect if resolved route matches current route (#1889, #2226)
    const destination = config.switchLocalePath(locale, to) || config.localePath(to.fullPath, locale)
    if (isEqual(destination, to.fullPath)) { return }

    return { path: destination, code: config.redirectStatusCode }
  }
}

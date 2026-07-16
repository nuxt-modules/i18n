import { joinURL } from 'ufo'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from './utils'
import { createTrailingSlashFormatter, getLocaleFromRoutePath, getRouteBaseName, prefixable } from '#i18n-kit/routing'
import { getDefaultLocaleForDomain, isSupportedLocale } from '../shared/locales'
import { isLocaleOnHost } from '../shared/domain'

import type { RouteLocationPathRaw, RouteRecordNameGeneric, Router } from 'vue-router'
import type { PrefixableOptions } from '#i18n-kit/routing'
import type { LocaleObject, Strategies } from '#internal-i18n-types'
import type { RouteLike, RouteLikeWithName, RouteLikeWithPath } from './routing'
import type { I18nRouteMeta, RouteLocationGenericPath } from '../types'

/**
 * Platform-neutral context used by the routing functions (`localePath`,
 * `localeRoute`, `switchLocalePath`, `getRouteBaseName`).
 *
 * @internal
 */
export type RoutingContext = {
  router: Router
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: (locale?: string) => string
  /** Extracts the route base name (without locale suffix) */
  getRouteBaseName: (route: RouteRecordNameGeneric | RouteLocationGenericPath | null) => string | undefined
  /** Modifies the resolved localized path. Middleware for `switchLocalePath` */
  afterSwitchLocalePath: (path: string, locale: string) => string
  /** Provides localized dynamic parameters for the current route */
  getLocalizedDynamicParams: (locale: string) => Record<string, unknown> | false | undefined
  /** Prepares a route object to be resolved as a localized route */
  resolveLocalizedRouteObject: (route: RouteLike, locale: string) => RouteLike
  getRouteLocalizedParams: () => Partial<I18nRouteMeta>
}

/**
 * Explicit inputs from which a {@link RoutingContext} is constructed, so the
 * context can be created without a Nuxt app (e.g. in unit tests with a
 * memory-history router).
 *
 * @internal
 */
export interface RoutingContextOptions {
  router: Router
  defaultLocale: string
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: (locale?: string) => string
  /** Host of the current request/page, used for domain-based behavior */
  getHost: () => string | undefined
  /**
   * Returns the `switchLocalePath` payload when it takes precedence over route
   * meta (strict SEO client-side hydration), a falsy value otherwise.
   */
  getLocalePathPayload?: () => Record<string, Record<string, string> | false> | false | undefined
  strategy: Strategies
  /** Whether routes are localized (pages enabled and strategy is not `no_prefix`) */
  routing: boolean
  /** Whether locales are resolved from domains */
  domains: boolean
  trailingSlash: boolean
  strictSeo: boolean
  compactRoutes: boolean
}

// RouteLike object has a path and no name.
export const isRouteLocationPathRaw = (val: RouteLike): val is RouteLocationPathRaw => !!val.path && !val.name

export function createRoutingContext(options: RoutingContextOptions): RoutingContext {
  const { router, defaultLocale, strictSeo, compactRoutes } = options
  const config: PrefixableOptions = {
    strategy: options.strategy,
    routing: options.routing,
    domains: options.domains,
  }
  const formatTrailingSlash = createTrailingSlashFormatter(options.trailingSlash)
  const getLocalizedRouteName = createLocaleRouteNameGetter(defaultLocale, config)

  function resolveLocalizedRouteByName(route: RouteLikeWithName, locale: string) {
    route.name = getRouteBaseName(route.name || router.currentRoute.value) // fallback to current route name

    // check if localized variant exists
    const localizedName = getLocalizedRouteName(route.name, locale)
    if (router.hasRoute(localizedName)) {
      route.name = localizedName
      // Remove stale locale param inherited from a compact route — per-locale routes don't use it
      if (compactRoutes && route.params) {
        delete (route.params as Record<string, unknown>).locale
      }
    } else if (compactRoutes && isSupportedLocale(locale) && getCompactRouteNames().has(route.name!)) {
      // Compact route: keep base name, inject locale as route param.
      route.params = { ...(route.params || {}), locale }
      return route
    }

    // No per-locale or compact match: set localized name so router.resolve
    // fails for unsupported locales (e.g. 'undefined'), matching per-locale behavior.
    route.name = localizedName
    return route
  }

  const routeByPathResolver = createLocalizedRouteByPathResolver(router, config)
  // Detect compact routes by their resolved path prefix — catches the compact
  // parent and its children (whose own meta is empty but whose path inherits
  // the locale segment). Route records are stable after build, so cache lazily.
  let compactRouteRecords: Set<string> | undefined
  function getCompactRouteNames() {
    if (compactRouteRecords) { return compactRouteRecords }
    compactRouteRecords = new Set()
    if (compactRoutes) {
      for (const r of router.getRoutes()) {
        if (r.name != null && /^\/:locale\(/.test(r.path)) { compactRouteRecords.add(String(r.name)) }
      }
    }
    return compactRouteRecords
  }

  function resolveLocalizedRouteByPath(input: RouteLikeWithPath, locale: string) {
    const route = routeByPathResolver(input, locale) as RouteLike
    const baseName = getRouteBaseName(route)

    if (baseName) {
      // Try per-locale route first (e.g. about___en) — this handles the default locale
      // in prefix_except_default where the unprefixed route exists alongside the compact one.
      const localizedName = getLocalizedRouteName(baseName, locale)
      if (router.hasRoute(localizedName)) {
        route.name = localizedName
        // Remove stale locale param inherited from a compact route — per-locale routes don't use it
        const named = route as RouteLikeWithName
        if (compactRoutes && named.params) {
          delete (named.params as Record<string, unknown>).locale
        }
        return route
      }

      // Path-pattern check (rather than router.resolve probe) avoids vue-router warnings
      // when `baseName` resolves to a non-compact route, e.g. defineI18nRoute(false).
      if (compactRoutes && getCompactRouteNames().has(baseName)) {
        const compacted = route as RouteLikeWithName
        compacted.name = baseName
        compacted.params = { ...(compacted.params || {}), locale }
        return compacted
      }

      // Set the localized route name — if the route doesn't exist (e.g. disabled routes),
      // router.resolve will fail and localePath correctly returns empty.
      route.name = localizedName
      return route
    }

    if (prefixable(locale, defaultLocale, config)) {
      route.path = '/' + locale + route.path
    }

    route.path = formatTrailingSlash(route.path, true)
    return route
  }

  const getRouteLocalizedParams = () =>
    (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>

  return {
    router,
    getLocale: options.getLocale,
    getLocales: options.getLocales,
    getBaseUrl: options.getBaseUrl,
    getRouteBaseName,
    getRouteLocalizedParams,
    getLocalizedDynamicParams: (locale) => {
      const payload = options.getLocalePathPayload?.()
      if (payload) {
        return payload[locale] || {}
      }
      return getRouteLocalizedParams()?.[locale]
    },
    afterSwitchLocalePath: (path, locale) => {
      const params = getRouteLocalizedParams()
      if (strictSeo && locale && Object.keys(params).length && !params[locale]) {
        return ''
      }

      if (!config.domains) {
        return path
      }

      // per-locale host membership decides the link shape: on-host targets navigate
      // relative (unprefixed when the host default), off-host targets get an absolute
      // URL in the target domain's shape
      const host = options.getHost() ?? ''
      const target = options.getLocales().find(l => l.code === locale)
      const stripsDefaultPrefix
        = config.strategy === 'prefix_except_default' || config.strategy === 'prefix_and_default'

      if (isLocaleOnHost(target, host)) {
        if (stripsDefaultPrefix && locale === getDefaultLocaleForDomain(host, options.getLocales()) && getLocaleFromRoutePath(path) === locale) {
          return path.slice(locale.length + 1) || '/'
        }
        return path
      }

      if (stripsDefaultPrefix && target?.defaultForDomains?.length && getLocaleFromRoutePath(path) === locale) {
        path = path.slice(locale.length + 1) || '/'
      }
      return joinURL(options.getBaseUrl(locale), path)
    },
    resolveLocalizedRouteObject: (route, locale) => {
      return isRouteLocationPathRaw(route)
        ? resolveLocalizedRouteByPath(route, locale)
        : resolveLocalizedRouteByName(route, locale)
    },
  }
}

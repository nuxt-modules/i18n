import { joinURL } from 'ufo'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from './utils'
import {
  createTrailingSlashFormatter,
  defaultRouteNameSuffix,
  getLocaleFromRoutePath,
  getRouteBaseName,
  normalizeRouteName,
  prefixable,
} from '#i18n-kit/routing'
import { isSupportedLocale, resolveDefaultLocale } from '../shared/locales'
import { canonicalDomain, isLocaleOnHost, normalizeDomain } from '../shared/domain'

import type { RouteLocationPathRaw, RouteRecordNameGeneric, Router } from 'vue-router'
import type { PrefixableOptions } from '#i18n-kit/routing'
import type { NormalizedLocaleObject, Strategies } from '#internal-i18n-types'
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
  getLocales: () => NormalizedLocaleObject[]
  getBaseUrl: (locale?: string) => string
  /** Extracts the route base name (without locale suffix) */
  getRouteBaseName: (route: RouteRecordNameGeneric | RouteLocationGenericPath | null) => string | undefined
  /** Modifies the resolved localized path. Middleware for `switchLocalePath` */
  afterSwitchLocalePath: (path: string, locale: string) => string
  /** `afterSwitchLocalePath` for alternate links, shaped for the locale's canonical domain */
  getAlternatePath: (path: string, locale: string) => string
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
  /** The current host's unprefixed locale */
  defaultLocale: string
  /** Needed to shape a link for another domain, where the current host's `defaultLocale` says nothing */
  configuredDefaultLocale: string
  getLocale: () => string
  getLocales: () => NormalizedLocaleObject[]
  getBaseUrl: (locale?: string) => string
  getCanonicalBaseUrl: (locale: string) => string
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
  const _getLocalizedRouteName = createLocaleRouteNameGetter(name => router.hasRoute(name), config)
  // `experimental.localeAgnosticDefaultRoutes` adds one more candidate to the getter's probe: the
  // locale-agnostic `<base>___default`, for the host's default locale only. That name carries no
  // locale, so `defaultLocale` - which comes from runtime config - can differ from the one the
  // build was made with and still address the unprefixed tree. Wrapped here rather than inside
  // `createLocaleRouteNameGetter` because that helper is deliberately locale-blind, and this is the
  // only place the resolved default locale is known.
  const getLocalizedRouteName = !__I18N_LOCALE_AGNOSTIC_DEFAULT_ROUTES__
    ? _getLocalizedRouteName
    : (name: RouteRecordNameGeneric | null, locale: string) => {
        if (locale === defaultLocale) {
          const agnosticName = normalizeRouteName(name) + defaultRouteNameSuffix
          if (router.hasRoute(agnosticName)) { return agnosticName }
        }
        return _getLocalizedRouteName(name, locale)
      }

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

  // a route carrying localized params it misses for `locale` is unavailable there (strict SEO)
  const missesLocalizedParams = (locale: string, params = getRouteLocalizedParams()) =>
    strictSeo && !!locale && Object.keys(params).length > 0 && !params[locale]

  const stripsDefaultPrefix
    = config.strategy === 'prefix_except_default' || config.strategy === 'prefix_and_default'

  const unprefixesLocale = (domain: string | undefined, locale: string, locales: NormalizedLocaleObject[]) =>
    !!domain && resolveDefaultLocale(normalizeDomain(domain), options.configuredDefaultLocale, locales) === locale

  // without a base the path stays relative to the current host, which prefixes the locale - and
  // `joinURL('', '/')` collapses to an empty href
  const toDomainUrl = (getBase: (locale: string) => string) =>
    (path: string, locale: string, target: NormalizedLocaleObject | undefined, locales: NormalizedLocaleObject[]) => {
      const base = getBase(locale)
      if (!base) {
        return path
      }
      if (stripsDefaultPrefix && unprefixesLocale(canonicalDomain(target), locale, locales) && getLocaleFromRoutePath(path) === locale) {
        path = path.slice(locale.length + 1) || '/'
      }
      return joinURL(base, path)
    }

  // serving URLs stay relative on an unconfigured host, so dev and staging never link to production
  const toServingUrl = toDomainUrl(options.getBaseUrl)
  const toCanonicalUrl = toDomainUrl(options.getCanonicalBaseUrl)

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
      if (missesLocalizedParams(locale)) {
        return ''
      }

      if (!config.domains) {
        return path
      }

      // membership is strict on purpose: a locale living on another domain needs an absolute link
      // even from an unconfigured host, and under `no_prefix` a relative path switches nothing
      const host = options.getHost() ?? ''
      const locales = options.getLocales()
      const target = locales.find(l => l.code === locale)

      // `setupMultiDomainLocales` already unprefixed this host's own default locale in the route
      // table, so a path resolved here needs no reshaping
      if (isLocaleOnHost(target, host)) {
        return path
      }

      // the route does not resolve for this locale (disabled for the page), joining an empty
      // path would point the link and its hreflang at the target domain's home page
      if (!path) {
        return path
      }

      return toServingUrl(path, locale, target, locales)
    },
    getAlternatePath: (path, locale) => {
      // the current page has a URL even when the params map omits its locale, and its canonical
      // resolves through here - excluding the page itself is worse than advertising an unlisted one
      if (locale !== options.getLocale() && missesLocalizedParams(locale)) {
        return ''
      }
      if (!config.domains || !path) {
        return path
      }
      const locales = options.getLocales()
      return toCanonicalUrl(path, locale, locales.find(l => l.code === locale), locales)
    },
    resolveLocalizedRouteObject: (route, locale) => {
      return isRouteLocationPathRaw(route)
        ? resolveLocalizedRouteByPath(route, locale)
        : resolveLocalizedRouteByName(route, locale)
    },
  }
}

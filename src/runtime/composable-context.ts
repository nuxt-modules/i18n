import { joinURL } from 'ufo'
import { useHead, useNuxtApp, useRequestEvent, useRequestURL, useRouter } from '#imports'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from './routing/utils'
import { formatTrailingSlash, getRouteBaseName, prefixable } from '#i18n-kit/routing'
import { getDefaultLocaleForDomain, isSupportedLocale } from './shared/locales'
import { useDetectors } from './shared/detection'
import { useI18nDetection } from './shared/utils'

import type { NuxtApp } from '#app'
import type { RouteLocationPathRaw, RouteRecordNameGeneric, Router } from 'vue-router'
import type { I18nHeadMetaInfo, I18nHeadOptions, LocaleObject } from '#internal-i18n-types'
import type { NuxtI18nContext } from './context'
import type { RouteLike, RouteLikeWithName, RouteLikeWithPath } from './routing/routing'
import type { I18nRouteMeta, RouteLocationGenericPath } from './types'

/**
 * Common options used internally by composable functions, these
 * are initialized on request at the start of i18n:plugin.
 *
 * @internal
 */
export type ComposableContext = {
  router: Router
  routingOptions: {
    defaultLocale: string
    /** Use `canonicalQueries` for alternate links */
    strictCanonicals: boolean
    /** Enable/disable hreflangLinks */
    hreflangLinks: boolean
  }
  head: ReturnType<typeof import('nuxt/app').useHead>
  _head: ReturnType<typeof import('nuxt/app').useHead> | undefined
  metaState: Required<I18nHeadMetaInfo>
  seoSettings: I18nHeadOptions
  localePathPayload: Record<string, Record<string, string> | false>
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: () => string
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

// RouteLike object has a path and no name.
export const isRouteLocationPathRaw = (val: RouteLike): val is RouteLocationPathRaw => !!val.path && !val.name

export function useComposableContext(nuxtApp: NuxtApp): ComposableContext {
  const context = nuxtApp?._nuxtI18n?.composableCtx
  if (!context) {
    throw new Error(
      'i18n context is not initialized. Ensure the i18n plugin is installed and the composable is used within a Vue component or setup function.',
    )
  }
  return context
}

export function createComposableContext(ctx: NuxtI18nContext, nuxtApp: NuxtApp = useNuxtApp()): ComposableContext {
  const router = useRouter()
  const detectors = useDetectors(useRequestEvent(), useI18nDetection(nuxtApp), nuxtApp)
  const defaultLocale = ctx.getDefaultLocale()
  const getLocalizedRouteName = createLocaleRouteNameGetter(defaultLocale)

  function resolveLocalizedRouteByName(route: RouteLikeWithName, locale: string) {
    route.name = getRouteBaseName(route.name || router.currentRoute.value) // fallback to current route name

    // check if localized variant exists
    const localizedName = getLocalizedRouteName(route.name, locale)
    if (router.hasRoute(localizedName)) {
      route.name = localizedName
      // Remove stale locale param inherited from a compact route — per-locale routes don't use it
      if (__I18N_COMPACT_ROUTES__ && route.params) {
        delete (route.params as Record<string, unknown>).locale
      }
    } else if (__I18N_COMPACT_ROUTES__ && isSupportedLocale(locale) && getCompactRouteNames().has(route.name!)) {
      // Compact route: keep base name, inject locale as route param.
      route.params = { ...(route.params || {}), locale }
      return route
    }

    // No per-locale or compact match: set localized name so router.resolve
    // fails for unsupported locales (e.g. 'undefined'), matching per-locale behavior.
    route.name = localizedName
    return route
  }

  const routeByPathResolver = createLocalizedRouteByPathResolver(router)
  // Detect compact routes by their resolved path prefix — catches the compact
  // parent and its children (whose own meta is empty but whose path inherits
  // the locale segment). Route records are stable after build, so cache lazily.
  let compactRouteRecords: Set<string> | undefined
  function getCompactRouteNames() {
    if (compactRouteRecords) { return compactRouteRecords }
    compactRouteRecords = new Set()
    if (__I18N_COMPACT_ROUTES__) {
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
        if (__I18N_COMPACT_ROUTES__ && named.params) {
          delete (named.params as Record<string, unknown>).locale
        }
        return route
      }

      // Path-pattern check (rather than router.resolve probe) avoids vue-router warnings
      // when `baseName` resolves to a non-compact route, e.g. defineI18nRoute(false).
      if (__I18N_COMPACT_ROUTES__ && getCompactRouteNames().has(baseName)) {
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

    if (prefixable(locale, defaultLocale)) {
      route.path = '/' + locale + route.path
    }

    route.path = formatTrailingSlash(route.path, true)
    return route
  }

  const composableCtx: ComposableContext = {
    router,
    _head: undefined,
    get head() {
      this._head ??= useHead({})
      return this._head
    },
    metaState: { htmlAttrs: {}, meta: [], link: [] },
    seoSettings: {
      dir: __I18N_STRICT_SEO__,
      lang: __I18N_STRICT_SEO__,
      // the object form carries `canonicalQueries`, `__I18N_STRICT_SEO__` only compiles its truthiness
      seo: (typeof ctx.config.experimental.strictSeo === 'object' && ctx.config.experimental.strictSeo)
        || __I18N_STRICT_SEO__,
    },
    localePathPayload: getLocalePathPayload(),
    routingOptions: {
      defaultLocale,
      strictCanonicals: ctx.config.experimental.alternateLinkCanonicalQueries ?? true,
      hreflangLinks: !(!__I18N_ROUTING__ && !__DIFFERENT_DOMAINS__),
    },
    getLocale: ctx.getLocale,
    getLocales: ctx.getLocales,
    getBaseUrl: ctx.getBaseUrl,
    getRouteBaseName,
    getRouteLocalizedParams: () =>
      (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>,
    getLocalizedDynamicParams: (locale) => {
      if (__I18N_STRICT_SEO__ && import.meta.client && nuxtApp.isHydrating && composableCtx.localePathPayload) {
        return composableCtx.localePathPayload[locale] || {}
      }
      return composableCtx.getRouteLocalizedParams()?.[locale]
    },
    afterSwitchLocalePath: (path, locale) => {
      const params = composableCtx.getRouteLocalizedParams()
      if (__I18N_STRICT_SEO__ && locale && Object.keys(params).length && !params[locale]) {
        return ''
      }

      // remove prefix if path is default for domain
      if (__MULTI_DOMAIN_LOCALES__ && __I18N_STRATEGY__ === 'prefix_except_default') {
        const defaultLocale = getDefaultLocaleForDomain(useRequestURL({ xForwardedHost: true }).host)
        if (locale !== defaultLocale || detectors.route(path) !== defaultLocale) {
          return path
        }

        // remove default locale prefix
        return path.slice(locale.length + 1)
      }

      if (__DIFFERENT_DOMAINS__) {
        return joinURL(ctx.getBaseUrl(locale), path)
      }
      return path
    },
    resolveLocalizedRouteObject: (route, locale) => {
      return isRouteLocationPathRaw(route)
        ? resolveLocalizedRouteByPath(route, locale)
        : resolveLocalizedRouteByName(route, locale)
    },
  }
  return composableCtx
}

function getLocalePathPayload(nuxtApp = useNuxtApp()) {
  const payload = import.meta.client && document.querySelector(`[data-nuxt-i18n-slp="${nuxtApp._id}"]`)?.textContent
  return JSON.parse(payload || '{}') as Record<string, Record<string, string> | false>
}

declare global {
  interface Window {
    _i18nSlp: Record<string, Record<string, unknown> | false> | undefined
  }
}

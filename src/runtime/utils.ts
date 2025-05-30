import { isEqual, joinURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { isFunction, isString } from '@intlify/shared'
import { navigateTo, useHead, useNuxtApp, useRouter } from '#imports'
import { vueI18nConfigs } from '#build/i18n.options.mjs'
import { getComposer } from './compatibility'
import { getDefaultLocaleForDomain } from './domain'
import { loadVueI18nOptions } from './shared/messages'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from './routing/utils'
import { getRouteBaseName } from '#i18n-kit/routing'
import {
  localePath,
  switchLocalePath,
  type RouteLike,
  type RouteLikeWithName,
  type RouteLikeWithPath
} from './routing/routing'
import { useNuxtI18nContext } from './context'

import type { Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { RouteLocationPathRaw, Router, RouteRecordNameGeneric } from 'vue-router'
import type {
  BaseUrlResolveHandler,
  DetectBrowserLanguageOptions,
  I18nHeadMetaInfo,
  I18nHeadOptions,
  LocaleObject
} from '#internal-i18n-types'
import type { CompatRoute, I18nRouteMeta, RouteLocationGenericPath } from './types'

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
  head: ReturnType<typeof useHead>
  metaState: Required<I18nHeadMetaInfo>
  seoSettings: I18nHeadOptions
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: () => string
  getSLP: () => Record<string, Record<string, string> | false>
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

export function useComposableContext(): ComposableContext {
  const context = useNuxtApp()._nuxtI18n
  if (!context) {
    throw new Error(
      'i18n context is not initialized. Ensure the i18n plugin is installed and the composable is used within a Vue component or setup function.'
    )
  }
  return context
}
const formatTrailingSlash = __TRAILING_SLASH__ ? withTrailingSlash : withoutTrailingSlash
export function createComposableContext(): ComposableContext {
  const router = useRouter()
  const ctx = useNuxtI18nContext()
  const nuxtApp = useNuxtApp()
  const defaultLocale = ctx.getDefaultLocale()
  const routeByPathResolver = createLocalizedRouteByPathResolver(router)
  const getLocalizedRouteName = createLocaleRouteNameGetter(defaultLocale)

  function resolveLocalizedRouteByName(route: RouteLikeWithName, locale: string) {
    route.name ||= getRouteBaseName(router.currentRoute.value) // fallback to current route name

    // check if localized variant exists
    const localizedName = getLocalizedRouteName(route.name, locale)
    if (router.hasRoute(localizedName)) {
      route.name = localizedName
    }

    return route
  }

  function resolveLocalizedRouteByPath(input: RouteLikeWithPath, locale: string) {
    const route = routeByPathResolver(input, locale) as RouteLike
    const baseName = getRouteBaseName(route)

    if (baseName) {
      route.name = getLocalizedRouteName(baseName, locale)
      return route
    }

    if (prefixable(locale, defaultLocale)) {
      route.path = '/' + locale + route.path
    }

    route.path = formatTrailingSlash(route.path, true)
    return route
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const slp: Record<string, Record<string, string> | false> = import.meta.client
    ? JSON.parse(document.querySelector(`[data-nuxt-i18n-slp="${nuxtApp._id}"]`)?.textContent ?? '{}')
    : {}

  const composableCtx: ComposableContext = {
    router,
    head: useHead({}),
    metaState: { htmlAttrs: {}, meta: [], link: [] },
    seoSettings: {
      dir: __I18N_STRICT_SEO__,
      lang: __I18N_STRICT_SEO__,
      seo: __I18N_STRICT_SEO__
    },
    getSLP: () => slp,
    routingOptions: {
      defaultLocale: defaultLocale,
      strictCanonicals: ctx.config.experimental.alternateLinkCanonicalQueries ?? true,
      hreflangLinks: !(!__I18N_ROUTING__ && !__DIFFERENT_DOMAINS__)
    },
    getLocale: ctx.getLocale,
    getLocales: ctx.getLocales,
    getBaseUrl: ctx.getBaseUrl,
    getRouteBaseName,
    getRouteLocalizedParams: () =>
      (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>,
    getLocalizedDynamicParams: locale => {
      if (__I18N_STRICT_SEO__ && import.meta.client && nuxtApp.isHydrating && slp) {
        return slp[locale] || {}
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
        const defaultLocale = getDefaultLocaleForDomain()
        if (locale !== defaultLocale || ctx.getRouteLocale(path) !== defaultLocale) {
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
    }
  }
  return composableCtx
}

declare global {
  interface Window {
    _i18nSlp: Record<string, Record<string, unknown> | false> | undefined
  }
}

export async function loadAndSetLocale(locale: Locale): Promise<string> {
  const nuxt = useNuxtApp()
  const ctx = useNuxtI18nContext()
  const oldLocale = ctx.getLocale()

  // skip if locale is already set
  if (locale === oldLocale && !ctx.firstAccess) {
    return locale
  }

  const data = { oldLocale, newLocale: locale, initialSetup: ctx.firstAccess, context: nuxt }
  let override = (await nuxt.callHook('i18n:beforeLocaleSwitch', data)) as string | undefined
  if (override != null && import.meta.dev) {
    console.warn('[nuxt-i18n] Do not return in `i18n:beforeLocaleSwitch`, mutate `data.newLocale` instead.')
  }
  override ??= data.newLocale

  if (ctx.isSupportedLocale(override)) {
    locale = override
  }

  await ctx.loadMessages(locale)
  await ctx.setLocaleSuspend(locale)

  return locale
}

function skipDetect(detect: DetectBrowserLanguageOptions, path: string, pathLocale: string): boolean {
  // no routes - force detection
  if (!__I18N_ROUTING__) {
    return false
  }

  // detection only on root
  if (detect.redirectOn === 'root' && path !== '/') {
    return true
  }

  // detection only on unprefixed route
  if (detect.redirectOn === 'no prefix' && !detect.alwaysRedirect && pathLocale) {
    return true
  }

  return false
}

export function detectLocale(route: string | CompatRoute): string {
  const nuxtApp = useNuxtApp()
  const path = isString(route) ? route : route.path
  const ctx = useNuxtI18nContext(nuxtApp)

  function* detect() {
    if (ctx.firstAccess && ctx.detection.enabled && !skipDetect(ctx.detection, path, ctx.getRouteLocale(path))) {
      yield ctx.getCookieLocale()
      yield ctx.getBrowserLocale() // navigator or header
      yield ctx.detection.fallbackLocale
    }

    if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
      yield ctx.getDomainLocale(path)
    }

    if (__I18N_ROUTING__) {
      yield ctx.getRouteLocale(route)
    }
  }

  for (const detected of detect()) {
    if (detected) {
      return detected
    }
  }

  return ctx.getLocale() || ctx.getDefaultLocale() || ''
}

export function navigate(to: CompatRoute, locale: string) {
  if (!__I18N_ROUTING__ || __DIFFERENT_DOMAINS__) return

  const ctx = useNuxtI18nContext()
  const _ctx = useComposableContext()

  if (to.path === '/' && ctx.rootRedirect) {
    return navigateTo(localePath(_ctx, ctx.rootRedirect.path, locale), { redirectCode: ctx.rootRedirect.code })
  }

  // skip - pending locale inside navigation middleware
  if (ctx.vueI18n.__pendingLocale && useNuxtApp()._processingMiddleware) {
    return
  }

  // skip - redirection optional prevents prefix removal, reconsider if needed (#2288)
  if (ctx.getRouteLocale(to) === locale) {
    return
  }

  // skip redirect if resolved route matches current route (#1889, #2226)
  const destination = switchLocalePath(_ctx, locale, to) || localePath(_ctx, to.fullPath, locale)
  if (isEqual(destination, to.fullPath)) {
    return
  }

  return navigateTo(destination)
}

export function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    !__DIFFERENT_DOMAINS__ &&
    __I18N_ROUTING__ &&
    // only prefix default locale with strategy prefix
    (currentLocale !== defaultLocale || __I18N_STRATEGY__ === 'prefix')
  )
}

/**
 * Returns a getter function which returns the baseUrl
 */
export function createBaseUrlGetter(
  nuxt: NuxtApp,
  baseUrl: string | BaseUrlResolveHandler<unknown> | undefined,
  defaultLocale: string,
  getDomainFromLocale: (locale: string) => string | undefined
): () => string {
  if (isFunction(baseUrl)) {
    import.meta.dev &&
      console.warn('[nuxt-i18n] Configuring baseUrl as a function is deprecated and will be removed in v11.')
    return (): string => baseUrl(nuxt)
  }

  return (): string => {
    if (__DIFFERENT_DOMAINS__ && defaultLocale) {
      return (getDomainFromLocale(defaultLocale) || baseUrl) ?? ''
    }

    return baseUrl ?? ''
  }
}

// collect unique keys of passed objects
function uniqueKeys(...objects: Array<Record<string, unknown>>): string[] {
  const keySet = new Set<string>()

  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      keySet.add(key)
    }
  }

  return Array.from(keySet)
}

// HMR helper functionality
export function createNuxtI18nDev() {
  const ctx = useNuxtI18nContext()
  const composer = getComposer(ctx.vueI18n)

  /**
   * Triggers a reload of vue-i18n configs (if needed) and locale message files in the correct order
   *
   * @param locale only passed when a locale file has been changed, if `undefined` indicates a vue-i18n config change
   */
  async function resetI18nProperties(locale?: string) {
    const opts: I18nOptions = await loadVueI18nOptions(vueI18nConfigs)

    const messageLocales = uniqueKeys(opts.messages!, composer.messages.value)
    for (const k of messageLocales) {
      if (locale && k !== locale) continue

      if (opts?.messages && k in opts.messages) {
        composer.setLocaleMessage(k, opts?.messages[k] ?? {})
      }

      await ctx.loadMessages(k)
    }

    // skip vue-i18n config properties if locale is passed (locale file HMR)
    if (locale != null) return

    const numberFormatLocales = uniqueKeys(opts.numberFormats || {}, composer.numberFormats.value)
    for (const k of numberFormatLocales) {
      composer.setNumberFormat(k, opts.numberFormats?.[k] || {})
    }

    const datetimeFormatsLocales = uniqueKeys(opts.datetimeFormats || {}, composer.datetimeFormats.value)
    for (const k of datetimeFormatsLocales) {
      composer.setDateTimeFormat(k, opts.datetimeFormats?.[k] || {})
    }
  }

  return { resetI18nProperties }
}

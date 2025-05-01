import { isEqual, joinURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { assign, isFunction, isString } from '@intlify/shared'
import { navigateTo, useNuxtApp, useRouter, useState } from '#imports'
import { localeCodes, localeLoaders, normalizedLocales, vueI18nConfigs } from '#build/i18n.options.mjs'
import { getComposer, getI18nTarget } from './compatibility'
import { getHost, getLocaleDomain } from './domain'
import { detectBrowserLanguage } from './internal'
import { loadAndSetLocaleMessages, loadVueI18nOptions } from './messages'
import { normalizeRouteName, getRouteBaseName as _getRouteBaseName, getLocalizedRouteName } from '#i18n-kit/routing'
import {
  localePath,
  switchLocalePath,
  type RouteLike,
  type RouteLikeWithName,
  type RouteLikeWithPath
} from './routing/routing'
import { createLogger } from '#nuxt-i18n/logger'
import { unref } from 'vue'

import type { I18n, Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { RouteLocationPathRaw, RouteLocationResolvedGeneric, Router, RouteRecordNameGeneric } from 'vue-router'
import type { I18nPublicRuntimeConfig, LocaleObject } from '#internal-i18n-types'
import type { CompatRoute, I18nRouteMeta, RouteLocationGenericPath } from './types'

export function formatMessage(message: string) {
  return `[${__NUXT_I18N_MODULE_ID__}]: ${message}`
}

/**
 * Common options used internally by composable functions, these
 * are initialized on request at the start of i18n:plugin.
 *
 * @internal
 */
export type ComposableContext = {
  router: Router
  getRoutingOptions: () => {
    defaultLocale: string
    /** Use `canonicalQueries` for alternate links */
    strictCanonicals: boolean
    /** Enable/disable hreflangLinks */
    hreflangLinks: boolean
  }
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: () => string
  /** Extracts the route base name (without locale suffix) */
  getRouteBaseName: (route: RouteRecordNameGeneric | RouteLocationGenericPath | null) => string | undefined
  /** Modifies the resolved localized path. Middleware for `switchLocalePath` */
  afterSwitchLocalePath: (path: string, locale: string) => string
  /** Provides localized dynamic parameters for the current route */
  getLocalizedDynamicParams: (locale: string) => Record<string, unknown> | undefined
  /** Prepares a route object to be resolved as a localized route */
  resolveLocalizedRouteObject: (route: RouteLike, locale: string) => RouteLike
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

type ComposableContextOptions = {
  i18n: I18n
  runtimeI18n: I18nPublicRuntimeConfig
  getDomainFromLocale: (locale: Locale) => string | undefined
}
export function createComposableContext({
  i18n: _i18n,
  runtimeI18n,
  getDomainFromLocale
}: ComposableContextOptions): ComposableContext {
  const router = useRouter()
  const nuxt = useNuxtApp()
  const i18n = getI18nTarget(_i18n)

  const routeByPathResolver = createLocalizedRouteByPathResolver(router)
  const getLocalizedRouteName = createLocaleRouteNameGetter(runtimeI18n.defaultLocale)

  function getRouteBaseName(route: RouteRecordNameGeneric | RouteLocationGenericPath | null) {
    return _getRouteBaseName(route, __ROUTE_NAME_SEPARATOR__)
  }

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

    if (!__DIFFERENT_DOMAINS__ && prefixable(locale, runtimeI18n.defaultLocale)) {
      route.path = '/' + locale + route.path
    }

    route.path = (__TRAILING_SLASH__ ? withTrailingSlash : withoutTrailingSlash)(route.path, true)
    return route
  }

  return {
    router,
    getRoutingOptions: () => ({
      defaultLocale: runtimeI18n.defaultLocale,
      strictCanonicals: runtimeI18n.experimental.alternateLinkCanonicalQueries ?? true,
      hreflangLinks: !(__I18N_STRATEGY__ === 'no_prefix' && !__DIFFERENT_DOMAINS__)
    }),
    getLocale: () => unref(i18n.locale),
    getLocales: () => {
      const locales = unref(i18n.locales)
      return locales.map(x => (isString(x) ? { code: x } : x))
    },
    getBaseUrl: () => joinURL(unref(i18n.baseUrl), nuxt.$config.app.baseURL),
    getRouteBaseName,
    getLocalizedDynamicParams: locale => {
      const params = (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>
      return params[locale]
    },
    afterSwitchLocalePath: (path, locale) => {
      if (__DIFFERENT_DOMAINS__) {
        const domain = getDomainFromLocale(locale)
        return (domain && joinURL(domain, path)) || path
      }
      return path
    },
    resolveLocalizedRouteObject: (route, locale) => {
      return isRouteLocationPathRaw(route)
        ? resolveLocalizedRouteByPath(route, locale)
        : resolveLocalizedRouteByName(route, locale)
    }
  }
}

export async function loadAndSetLocale(newLocale: Locale, initial: boolean = false): Promise<boolean> {
  const logger = /*#__PURE__*/ createLogger('loadAndSetLocale')
  const nuxtApp = useNuxtApp()
  const runtimeI18n = nuxtApp.$config.public.i18n as I18nPublicRuntimeConfig
  const { skipSettingLocaleOnNavigate, detectBrowserLanguage: opts } = runtimeI18n

  const oldLocale = unref(nuxtApp.$i18n.locale)
  const localeCodes = unref(nuxtApp.$i18n.localeCodes)

  // sets the locale cookie if unset or not up to date
  function syncCookie(locale: Locale = oldLocale) {
    if (opts === false || !opts.useCookie) return
    if (skipSettingLocaleOnNavigate) return

    nuxtApp.$i18n.setLocaleCookie(locale)
  }

  // call `onBeforeLanguageSwitch` which may return an override for `newLocale`
  const localeOverride = await nuxtApp.$i18n.onBeforeLanguageSwitch(oldLocale, newLocale, initial, nuxtApp)
  if (localeOverride && localeCodes.includes(localeOverride)) {
    // resolved `localeOverride` is already in use
    if (oldLocale === localeOverride) {
      syncCookie()
      return false
    }

    newLocale = localeOverride
  }

  __DEBUG__ && logger.log({ newLocale, oldLocale, initial })

  // `newLocale` is unset or empty
  if (!newLocale) {
    syncCookie()
    return false
  }

  // no change if different domains option enabled
  if (!initial && __DIFFERENT_DOMAINS__) {
    syncCookie()
    return false
  }

  if (oldLocale === newLocale) {
    syncCookie()
    return false
  }

  // load locale messages required by `newLocale`
  if (
    !nuxtApp._i18nPreloaded ||
    !nuxtApp._vueI18n.__firstAccess ||
    !__HAS_PAGES__ ||
    __I18N_STRATEGY__ === 'no_prefix'
  ) {
    await nuxtApp._i18nLoadAndSetMessages(newLocale)
  }

  if (skipSettingLocaleOnNavigate) {
    return false
  }

  // sync cookie and set the locale
  syncCookie(newLocale)
  nuxtApp._vueI18n.__setLocale(newLocale)

  await nuxtApp.$i18n.onLanguageSwitched(oldLocale, newLocale)

  return true
}

export function detectLocale(
  route: string | CompatRoute,
  routeLocale: string,
  currentLocale: string | undefined,
  localeCookie: string | undefined
) {
  const nuxtApp = useNuxtApp()

  const runtimeI18n = nuxtApp.$config.public.i18n as I18nPublicRuntimeConfig
  const { defaultLocale, detectBrowserLanguage: _detect } = runtimeI18n
  const logger = /*#__PURE__*/ createLogger('detectLocale')

  const detectedBrowser = detectBrowserLanguage(route, localeCookie, currentLocale)
  __DEBUG__ && logger.log({ detectBrowserLanguage: detectedBrowser })

  // detected browser language
  if (detectedBrowser.locale && detectedBrowser.from != null && localeCodes.includes(detectedBrowser.locale)) {
    return detectedBrowser.locale
  }

  let detected: string = ''
  __DEBUG__ && logger.log('1/3', { detected, strategy: __I18N_STRATEGY__ })

  // detect locale by route
  if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
    detected ||= getLocaleDomain(normalizedLocales, route)
  } else if (__I18N_STRATEGY__ !== 'no_prefix') {
    detected ||= routeLocale
  }

  __DEBUG__ && logger.log('2/3', { detected, detectBrowserLanguage: _detect })

  const cookieLocale =
    (localeCodes.includes(detectedBrowser.locale) || (localeCookie && localeCodes.includes(localeCookie))) &&
    _detect &&
    _detect.useCookie &&
    localeCookie
  detected ||= cookieLocale || currentLocale || defaultLocale || ''

  __DEBUG__ && logger.log('3/3', { detected, cookieLocale, defaultLocale, localeCookie })

  return detected
}

type DetectRedirectOptions = {
  to: CompatRoute
  from?: CompatRoute
  /** The locale we want to navigate to */
  locale: Locale
  /** Locale detected from route */
  routeLocale: string
}

/**
 * Returns a localized path to redirect to, or an empty string if no redirection should occur
 *
 * @param inMiddleware - whether this is called during navigation middleware
 */
export function detectRedirect({ to, from, locale, routeLocale }: DetectRedirectOptions, inMiddleware = false): string {
  // no locale change detected from routing
  if (routeLocale === locale || __I18N_STRATEGY__ === 'no_prefix') {
    return ''
  }

  const logger = /*#__PURE__*/ createLogger('detectRedirect')
  __DEBUG__ && logger.log({ to, from })
  __DEBUG__ && logger.log({ locale, routeLocale, inMiddleware })

  const ctx = useComposableContext()
  let redirectPath = switchLocalePath(ctx, locale, to)

  // current route is a 404, attempt to find a matching route using fullPath
  if (inMiddleware && !redirectPath) {
    redirectPath = localePath(ctx, to.fullPath, locale)
  }

  // resolved route is equal to current route, skip redirection (#1889, #2226)
  if (isEqual(redirectPath, to.fullPath) || (from && isEqual(redirectPath, from.fullPath))) {
    return ''
  }

  return redirectPath
}

// composable function for redirect loop avoiding
const useRedirectState = () => useState<string>(__NUXT_I18N_MODULE_ID__ + ':redirect', () => '')

type NavigateArgs = {
  nuxt: NuxtApp
  redirectPath: string
  locale: string
  route: CompatRoute
}

export async function navigate({ nuxt, locale, route, redirectPath }: NavigateArgs, enableNavigate = false) {
  const { rootRedirect, skipSettingLocaleOnNavigate, locales } = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
  const logger = /*#__PURE__*/ createLogger('navigate')

  __DEBUG__ &&
    logger.log('options', {
      rootRedirect,
      differentDomains: __DIFFERENT_DOMAINS__,
      skipSettingLocaleOnNavigate,
      enableNavigate,
      isSSG: __IS_SSG__
    })

  if (route.path === '/' && rootRedirect) {
    let redirectCode = 302
    if (isString(rootRedirect)) {
      redirectPath = '/' + rootRedirect
    } else {
      redirectPath = '/' + rootRedirect.path
      redirectCode = rootRedirect.statusCode
    }

    redirectPath = nuxt.$localePath(redirectPath, locale)
    __DEBUG__ && logger.log('rootRedirect mode', { redirectPath, redirectCode })
    return navigateTo(redirectPath, { redirectCode })
  }

  if (import.meta.client && skipSettingLocaleOnNavigate) {
    nuxt._vueI18n.__pendingLocale = locale
    nuxt._vueI18n.__pendingLocalePromise = new Promise(resolve => {
      nuxt._vueI18n.__resolvePendingLocalePromise = () => resolve()
    })
    if (!enableNavigate) {
      return
    }
  }

  if (__MULTI_DOMAIN_LOCALES__ && __I18N_STRATEGY__ === 'prefix_except_default') {
    const host = getHost()
    const currentDomain = locales.find(locale => {
      if (isString(locale)) return
      return locale.defaultForDomains?.find(domain => domain === host)
    })

    const defaultLocaleForDomain = !isString(currentDomain) ? currentDomain?.code : undefined

    if (route.path.startsWith(`/${defaultLocaleForDomain}`)) {
      return navigateTo(route.path.replace(`/${defaultLocaleForDomain}`, ''))
    }

    if (!route.path.startsWith(`/${locale}`) && locale !== defaultLocaleForDomain) {
      const oldLocale = nuxt._vueI18n.__localeFromRoute(route.path)

      if (oldLocale !== '') {
        return navigateTo(`/${locale + route.path.replace(`/${oldLocale}`, '')}`)
      }

      return navigateTo(`/${locale + (route.path === '/' ? '' : route.path)}`)
    }

    if (redirectPath && route.path !== redirectPath) {
      return navigateTo(redirectPath)
    }

    return
  }

  if (__DIFFERENT_DOMAINS__) {
    const state = useRedirectState()
    __DEBUG__ && logger.log('redirect', { state: state.value, redirectPath })
    if (state.value && state.value !== redirectPath) {
      if (import.meta.client) {
        state.value = '' // reset redirect path
        window.location.assign(redirectPath)
      }
      if (import.meta.server) {
        __DEBUG__ && logger.log('differentDomains servermode', { redirectPath })
        state.value = redirectPath // set redirect path
      }
    }
  } else if (redirectPath) {
    return navigateTo(redirectPath)
  }
}

export function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    // strategy has no prefixes
    __I18N_STRATEGY__ !== 'no_prefix' &&
    // strategy should not prefix default locale
    !(
      currentLocale === defaultLocale &&
      (__I18N_STRATEGY__ === 'prefix_and_default' || __I18N_STRATEGY__ === 'prefix_except_default')
    )
  )
}

/**
 * Returns a getter function which returns the baseUrl
 */
export function createBaseUrlGetter(nuxt: NuxtApp) {
  const logger = /*#__PURE__*/ createLogger('extendBaseUrl')
  const { baseUrl, defaultLocale } = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

  if (isFunction(baseUrl)) {
    return (): string => {
      const baseUrlResult = baseUrl(nuxt)
      __DEBUG__ && logger.log('using localeLoader function -', { baseUrlResult })
      return baseUrlResult
    }
  }

  const localeCode = isFunction(defaultLocale)
    ? /*#__PURE__*/ (defaultLocale as unknown as () => string)()
    : defaultLocale
  return (): string => {
    if (__DIFFERENT_DOMAINS__ && localeCode) {
      const domain = nuxt._i18nGetDomainFromLocale(localeCode)
      if (domain) {
        __DEBUG__ && logger.log('using differentDomains -', { domain })
        return domain
      }
    }

    __DEBUG__ && logger.log('using runtimeConfig -', { baseUrl })

    return baseUrl ?? ''
  }
}

/**
 * Returns a getter function which returns a localized route name for the given route and locale.
 * The returned function can vary based on the strategy and domain configuration.
 */
export function createLocaleRouteNameGetter(
  defaultLocale: string
): (name: RouteRecordNameGeneric | null, locale: string) => string {
  // no route localization
  if (__I18N_STRATEGY__ === 'no_prefix' && !__DIFFERENT_DOMAINS__) {
    return routeName => normalizeRouteName(routeName)
  }

  const localizeRouteName = (name: string, locale: string, isDefault: boolean) =>
    getLocalizedRouteName(name, locale, isDefault, __ROUTE_NAME_SEPARATOR__, __ROUTE_NAME_DEFAULT_SUFFIX__)

  // default locale routes have default suffix
  if (__I18N_STRATEGY__ === 'prefix_and_default') {
    return (name, locale) => localizeRouteName(normalizeRouteName(name), locale, locale === defaultLocale)
  }

  // routes are localized
  return (name, locale) => localizeRouteName(normalizeRouteName(name), locale, false)
}

/**
 * Factory function which returns a resolver function based on the routing strategy.
 */
export function createLocalizedRouteByPathResolver(
  router: Router
): (route: RouteLocationPathRaw, locale: Locale) => RouteLocationPathRaw | RouteLocationResolvedGeneric {
  if (__I18N_STRATEGY__ === 'no_prefix') {
    return route => route
  }
  if (__I18N_STRATEGY__ === 'prefix') {
    /**
     * The `router.resolve` function prints warnings when resolving non-existent paths and `router.hasRoute` only accepts named routes.
     * The path passed to `localePath` is not prefixed which will trigger vue-router warnings since all routes are prefixed.
     * We work around this by manually prefixing the path and finding the route in `router.options.routes`.
     */
    return (route, locale) => {
      const restPath = route.path.slice(1)
      const targetPath = route.path[0] + locale + (restPath && '/' + restPath)
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
  const nuxtApp = useNuxtApp()
  const composer = getComposer(nuxtApp._vueI18n)

  /**
   * Triggers a reload of vue-i18n configs (if needed) and locale message files in the correct order
   *
   * @param locale only passed when a locale file has been changed, if `undefined` indicates a vue-i18n config change
   */
  async function resetI18nProperties(locale?: string) {
    const opts: I18nOptions = await loadVueI18nOptions(vueI18nConfigs, nuxtApp)

    const messageLocales = uniqueKeys(opts.messages!, composer.messages.value)
    for (const k of messageLocales) {
      if (locale && k !== locale) continue
      const current = opts.messages![k] || {}
      // override config messages with locale files in correct order
      await loadAndSetLocaleMessages(k, localeLoaders, { [k]: current }, nuxtApp)
      composer.setLocaleMessage(k, current)
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

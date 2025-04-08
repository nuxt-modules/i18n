import { isEqual, joinURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { assign, isFunction, isString } from '@intlify/shared'
import { navigateTo, useNuxtApp, useRouter, useState } from '#imports'
import {
  DYNAMIC_PARAMS_KEY,
  NUXT_I18N_MODULE_ID,
  isSSG,
  localeCodes,
  localeLoaders,
  normalizedLocales,
  vueI18nConfigs
} from '#build/i18n.options.mjs'
import { getComposer, getI18nTarget } from './compatibility'
import { getHost, getLocaleDomain } from './domain'
import { detectBrowserLanguage, runtimeDetectBrowserLanguage } from './internal'
import { loadAndSetLocaleMessages, loadLocale, loadVueI18nOptions, makeFallbackLocaleCodes } from './messages'
import {
  getRouteName,
  getLocalizedRouteName,
  getLocalizedDefaultRouteName,
  getGenericRouteBaseName
} from '#i18n-kit/routing'
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
import type { I18nPublicRuntimeConfig, LocaleObject, Strategies } from '#internal-i18n-types'
import type { CompatRoute, I18nRouteMeta, RouteLocationGenericPath } from './types'

export function formatMessage(message: string) {
  return `[${NUXT_I18N_MODULE_ID}]: ${message}`
}

/**
 * Common options used internally by composable functions, these
 * are initialized on request at the start of i18n:plugin.
 *
 * @internal
 */
export type ComposableContext = {
  router: Router
  getRoutingOptions: () => Pick<
    I18nPublicRuntimeConfig,
    'strategy' | 'differentDomains' | 'routesNameSeparator' | 'defaultLocale' | 'trailingSlash' | 'defaultDirection'
  > & {
    /**
     * Use `canonicalQueries` for alternate links
     */
    strictCanonicals: boolean
    /**
     * Enable/disable hreflangLinks
     */
    hreflangLinks: boolean
  }
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: () => string
  /**
   * Extract route base name without localized suffix
   */
  getRouteBaseName: (route: RouteRecordNameGeneric | RouteLocationGenericPath | null) => string | undefined
  /**
   * `switchLocalePath` middleware
   *
   * Allows modifying the resolved localized path before it is returned
   */
  afterSwitchLocalePath: (path: string, locale: string) => string
  /**
   * `switchLocalePath` middleware
   *
   * Allows providing localized parameters during resolution of the current route
   */
  getLocalizedDynamicParams: (locale: string) => Record<string, unknown> | undefined
  /**
   * Prepares a route object to be resolved as a localized route
   */
  resolveLocalizedRouteObject: (route: RouteLike, locale: string) => RouteLike
}

export const isRouteLocationPathRaw = (val: RouteLike): val is RouteLocationPathRaw => !!val.path && !val.name
export function useComposableContext(): ComposableContext {
  return useNuxtApp()._nuxtI18n
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
  const { strategy, differentDomains, routesNameSeparator, defaultLocale, trailingSlash, defaultDirection } =
    runtimeI18n

  const routeByPathResolver = createLocalizedRouteByPathResolver(runtimeI18n.strategy, router)
  const getLocalizedRouteName = createLocaleRouteNameGetter(runtimeI18n)

  function getRouteBaseName(route: RouteRecordNameGeneric | RouteLocationGenericPath | null) {
    return getGenericRouteBaseName(route, routesNameSeparator)
  }

  function resolveLocalizedRouteByName(route: RouteLikeWithName, locale: string) {
    if (!route.name) {
      console.log('route name falsy on', route, locale)
    }
    // if name is falsy fallback to current route name
    route.name ||= getRouteBaseName(router.currentRoute.value)

    // route localization may be disabled, check if localized variant exists
    const localizedName = getLocalizedRouteName(route.name, locale)
    if (router.hasRoute(localizedName)) {
      route.name = localizedName
    }

    return route
  }

  const formatTrailingSlash = trailingSlash ? withTrailingSlash : withoutTrailingSlash
  function resolveLocalizedRouteByPath(input: RouteLikeWithPath, locale: string) {
    const route = routeByPathResolver(input, locale) as RouteLike

    const resolvedName = getRouteBaseName(route)
    if (resolvedName) {
      route.name = getLocalizedRouteName(resolvedName, locale)
      return route
    }

    // if route has a path defined but no name, resolve full route using the path
    if (!differentDomains && prefixable(locale, defaultLocale, strategy)) {
      route.path = '/' + locale + route.path
    }

    route.path = formatTrailingSlash(route.path, true)
    return route
  }

  return {
    router,
    getRoutingOptions: () => ({
      strategy,
      differentDomains,
      routesNameSeparator,
      defaultLocale,
      trailingSlash,
      defaultDirection,
      strictCanonicals: runtimeI18n.experimental.alternateLinkCanonicalQueries ?? true,
      hreflangLinks: !(strategy === 'no_prefix' && !differentDomains)
    }),
    getLocale: () => unref(i18n.locale),
    getLocales: () => {
      const locales = unref(i18n.locales)
      return locales.map(x => (isString(x) ? { code: x } : (x as LocaleObject)))
    },
    getBaseUrl: () => joinURL(unref(i18n.baseUrl), nuxt.$config.app.baseURL),
    getRouteBaseName,
    getLocalizedDynamicParams: locale => {
      const params = (router.currentRoute.value.meta[DYNAMIC_PARAMS_KEY] ?? {}) as Partial<I18nRouteMeta>
      return params[locale]
    },
    afterSwitchLocalePath: (path, locale) => {
      if (differentDomains) {
        const domain = getDomainFromLocale(locale)
        return (domain && joinURL(domain, path)) || path
      }
      return path
    },
    resolveLocalizedRouteObject: (route, locale) => {
      if (isRouteLocationPathRaw(route)) {
        return resolveLocalizedRouteByPath(route, locale)
      }

      return resolveLocalizedRouteByName(route, locale)
    }
  }
}

export async function loadAndSetLocale(newLocale: Locale, initial: boolean = false): Promise<boolean> {
  const logger = /*#__PURE__*/ createLogger('loadAndSetLocale')
  const nuxtApp = useNuxtApp()
  const { differentDomains, skipSettingLocaleOnNavigate } = nuxtApp.$config.public.i18n
  const opts = runtimeDetectBrowserLanguage()

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
  if (!initial && differentDomains) {
    syncCookie()
    return false
  }

  if (oldLocale === newLocale) {
    syncCookie()
    return false
  }

  // load locale messages required by `newLocale`
  // if (lazy) {
  const i18nFallbackLocales = unref(nuxtApp.$i18n.fallbackLocale)

  const setter = nuxtApp.$i18n.mergeLocaleMessage.bind(nuxtApp.$i18n)
  if (i18nFallbackLocales) {
    const fallbackLocales = makeFallbackLocaleCodes(i18nFallbackLocales, [newLocale])
    await Promise.all(fallbackLocales.map(locale => loadLocale(locale, localeLoaders, setter, nuxtApp)))
  }
  await loadLocale(newLocale, localeLoaders, setter, nuxtApp)
  // }

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
  const { strategy, defaultLocale, differentDomains, multiDomainLocales } = nuxtApp.$config.public.i18n
  const _detectBrowserLanguage = runtimeDetectBrowserLanguage()
  const logger = /*#__PURE__*/ createLogger('detectLocale')

  const detectedBrowser = detectBrowserLanguage(route, localeCookie, currentLocale)
  __DEBUG__ && logger.log({ detectBrowserLanguage: detectedBrowser })

  // detected browser language
  if (detectedBrowser.locale && detectedBrowser.from != null && localeCodes.includes(detectedBrowser.locale)) {
    return detectedBrowser.locale
  }

  let detected: string = ''
  __DEBUG__ && logger.log('1/3', { detected, strategy })

  // detect locale by route
  if (differentDomains || multiDomainLocales) {
    detected ||= getLocaleDomain(normalizedLocales, strategy, route)
  } else if (strategy !== 'no_prefix') {
    detected ||= routeLocale
  }

  __DEBUG__ && logger.log('2/3', { detected, detectBrowserLanguage: _detectBrowserLanguage })

  const cookieLocale =
    (localeCodes.includes(detectedBrowser.locale) || (localeCookie && localeCodes.includes(localeCookie))) &&
    _detectBrowserLanguage &&
    _detectBrowserLanguage.useCookie &&
    localeCookie
  detected ||= cookieLocale || currentLocale || defaultLocale || ''

  __DEBUG__ && logger.log('3/3', { detected, cookieLocale, defaultLocale, localeCookie })

  return detected
}

type DetectRedirectOptions = {
  to: CompatRoute
  from?: CompatRoute
  /**
   * The locale we want to navigate to
   */
  locale: Locale
  /**
   * Locale detected from route
   */
  routeLocale: string
}

/**
 * Returns a localized path to redirect to, or an empty string if no redirection should occur
 *
 * @param inMiddleware - whether this is called during navigation middleware
 */
export function detectRedirect({ to, from, locale, routeLocale }: DetectRedirectOptions, inMiddleware = false): string {
  // no locale change detected from routing
  if (routeLocale === locale || useNuxtApp().$i18n.strategy === 'no_prefix') {
    return ''
  }

  /**
   * `$switchLocalePath` and `$localePath` functions internally use `$router.currentRoute`
   * instead we use composable internals which allows us to pass the `to` route from navigation middleware.
   */
  const common = useComposableContext()
  const logger = /*#__PURE__*/ createLogger('detectRedirect')

  __DEBUG__ && logger.log({ to, from })
  __DEBUG__ && logger.log({ locale, routeLocale, inMiddleware })

  let redirectPath = switchLocalePath(common, locale, to)

  // if current route is a 404 we attempt to find a matching route using the full path
  if (inMiddleware && !redirectPath) {
    redirectPath = localePath(common, to.fullPath, locale)
  }

  // NOTE: #1889, #2226 if resolved route is the same as current route, skip redirection by returning empty string value
  if (isEqual(redirectPath, to.fullPath) || (from && isEqual(redirectPath, from.fullPath))) {
    return ''
  }

  return redirectPath
}

// composable function for redirect loop avoiding
const useRedirectState = () => useState<string>(NUXT_I18N_MODULE_ID + ':redirect', () => '')

type NavigateArgs = {
  nuxt: NuxtApp
  redirectPath: string
  locale: string
  route: CompatRoute
}

export async function navigate({ nuxt, locale, route, redirectPath }: NavigateArgs, enableNavigate = false) {
  const { rootRedirect, differentDomains, multiDomainLocales, skipSettingLocaleOnNavigate, locales, strategy } = nuxt
    .$config.public.i18n as I18nPublicRuntimeConfig
  const logger = /*#__PURE__*/ createLogger('navigate')

  __DEBUG__ &&
    logger.log('options', { rootRedirect, differentDomains, skipSettingLocaleOnNavigate, enableNavigate, isSSG })

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

  if (multiDomainLocales && strategy === 'prefix_except_default') {
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

  if (differentDomains) {
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

export function prefixable(currentLocale: string, defaultLocale: string, strategy: Strategies): boolean {
  return (
    // strategy has no prefixes
    strategy !== 'no_prefix' &&
    // strategy should not prefix default locale
    !(currentLocale === defaultLocale && (strategy === 'prefix_and_default' || strategy === 'prefix_except_default'))
  )
}

/**
 * Returns a getter function which returns the baseUrl
 */
export function createBaseUrlGetter(nuxt: NuxtApp) {
  const logger = /*#__PURE__*/ createLogger('extendBaseUrl')
  const { baseUrl, defaultLocale, differentDomains } = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

  if (isFunction(baseUrl)) {
    return (): string => {
      const baseUrlResult = baseUrl(nuxt)
      __DEBUG__ && logger.log('using localeLoader function -', { baseUrlResult })
      return baseUrlResult
    }
  }

  const localeCode = isFunction(defaultLocale) ? (defaultLocale() as string) : defaultLocale
  const getDomainFromLocale = nuxt._i18nGetDomainFromLocale
  return (): string => {
    if (differentDomains && localeCode) {
      const domain = getDomainFromLocale(localeCode)
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
export function createLocaleRouteNameGetter({
  strategy,
  differentDomains,
  defaultLocale,
  routesNameSeparator,
  defaultLocaleRouteNameSuffix
}: {
  strategy: Strategies
  differentDomains: boolean
  defaultLocale: string
  routesNameSeparator: string
  defaultLocaleRouteNameSuffix: string
}): (name: RouteRecordNameGeneric | null, locale: string) => string {
  // no route localization
  if (strategy === 'no_prefix' && !differentDomains) {
    return routeName => getRouteName(routeName)
  }

  // default locale routes have default suffix
  if (strategy === 'prefix_and_default') {
    return (name, locale) =>
      getLocalizedDefaultRouteName(
        getRouteName(name),
        locale,
        routesNameSeparator,
        defaultLocale,
        defaultLocaleRouteNameSuffix
      )
  }

  // routes are localized
  return (name, locale) => getLocalizedRouteName(getRouteName(name), locale, routesNameSeparator)
}

/**
 * Factory function which returns a resolver function based on the routing strategy.
 */
export function createLocalizedRouteByPathResolver(
  strategy: Strategies,
  router: Router
): (route: RouteLocationPathRaw, locale: Locale) => RouteLocationPathRaw | RouteLocationResolvedGeneric {
  switch (strategy) {
    case 'no_prefix':
      return route => route
    case 'prefix_and_default':
    case 'prefix_except_default':
    default:
      return route => router.resolve(route)
    case 'prefix':
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

    const messageLocales = uniqueKeys(opts.messages || {}, composer.messages.value)
    for (const k of messageLocales) {
      if (locale && k !== locale) continue
      const current = opts.messages?.[k] || {}
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

import { isEqual, joinURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { isFunction, isString } from '@intlify/shared'
import { navigateTo, useNuxtApp, useRouter, useRuntimeConfig, useState } from '#imports'
import { localeCodes, normalizedLocales, vueI18nConfigs } from '#build/i18n.options.mjs'
import { getComposer } from './compatibility'
import { getHost, getLocaleDomain } from './domain'
import { getCompatRoutePath } from './internal'
import { loadVueI18nOptions } from './shared/messages'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from './routing/utils'
import { getRouteBaseName as _getRouteBaseName, getRoutePathLocaleRegex } from '#i18n-kit/routing'
import {
  localePath,
  switchLocalePath,
  type RouteLike,
  type RouteLikeWithName,
  type RouteLikeWithPath
} from './routing/routing'
import { createLogger } from '#nuxt-i18n/logger'
import { unref } from 'vue'
import { useNuxtI18nContext } from './context'

import type { Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { RouteLocationPathRaw, Router, RouteRecordNameGeneric } from 'vue-router'
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

export function createComposableContext(runtimeI18n: I18nPublicRuntimeConfig): ComposableContext {
  const router = useRouter()
  const ctx = useNuxtI18nContext()

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
    getLocale: ctx.getLocale,
    getLocales: ctx.getLocales,
    getBaseUrl: ctx.getBaseUrl,
    getRouteBaseName,
    getLocalizedDynamicParams: locale => {
      const params = (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>
      return params[locale]
    },
    afterSwitchLocalePath: (path, locale) => {
      if (__DIFFERENT_DOMAINS__) {
        const domain = ctx.getDomainFromLocale(locale)
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
  const ctx = useNuxtI18nContext()
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
  if (!ctx.preloaded || !ctx.firstAccess || !__HAS_PAGES__ || __I18N_STRATEGY__ === 'no_prefix') {
    await ctx.loadLocaleMessages(newLocale)
  }

  if (skipSettingLocaleOnNavigate) {
    return false
  }

  // sync cookie and set the locale
  syncCookie(newLocale)
  ctx.setLocale(newLocale)

  await nuxtApp.$i18n.onLanguageSwitched(oldLocale, newLocale)

  return true
}

const LOCALE_PATH_RE = getRoutePathLocaleRegex(localeCodes)

function shouldSkipDetection(route: string | CompatRoute): boolean {
  const _detect = useRuntimeConfig().public.i18n.detectBrowserLanguage
  const ctx = useNuxtI18nContext()

  if (!_detect) {
    return true
  }

  if (__I18N_STRATEGY__ === 'no_prefix' || !__HAS_PAGES__) {
    return __IS_SSG__ && ctx.firstAccess && import.meta.server
  }

  if (!ctx.firstAccess) {
    return true
  }

  const path = getCompatRoutePath(route)

  // detection only on root
  if (_detect.redirectOn === 'root' && path !== '/') {
    return true
  }

  // detection only on unprefixed route
  if (_detect.redirectOn === 'no prefix' && !_detect.alwaysRedirect && path.match(LOCALE_PATH_RE)) {
    return true
  }

  return false
}

export function detectLocale(route: string | CompatRoute, routeLocale: string) {
  const nuxtApp = useNuxtApp()
  const runtimeI18n = useNuxtApp().$config.public.i18n as I18nPublicRuntimeConfig
  const { useCookie, fallbackLocale } = runtimeI18n.detectBrowserLanguage || {}

  function* detect() {
    if (!shouldSkipDetection(route)) {
      // navigation - strategy no_prefix
      if (!nuxtApp._nuxtI18nCtx.firstAccess && __I18N_STRATEGY__ === 'no_prefix') {
        yield unref(nuxtApp.$i18n.locale)
      }

      // cookie
      yield useCookie && nuxtApp.$i18n.getLocaleCookie()

      // navigator or header
      yield nuxtApp.$i18n.getBrowserLocale()

      // fallback
      yield fallbackLocale
    }

    if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
      // domain
      yield getLocaleDomain(normalizedLocales, route)
    } else if (__I18N_STRATEGY__ !== 'no_prefix') {
      // route
      yield routeLocale
    }
  }

  for (const detected of detect()) {
    if (detected) {
      return detected
    }
  }

  // fallback
  return unref(nuxtApp.$i18n.locale) || runtimeI18n.defaultLocale || ''
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
  const ctx = useNuxtI18nContext(nuxt)

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
    const vueI18n = ctx.getVueI18n()
    vueI18n.__pendingLocale = locale
    vueI18n.__pendingLocalePromise = new Promise(resolve => {
      vueI18n.__resolvePendingLocalePromise = () => resolve()
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
      const oldLocale = ctx.getLocaleFromRoute(route.path)

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
export function createBaseUrlGetter(
  nuxt: NuxtApp,
  getDomainFromLocale: (locale: string) => string | undefined
): () => string {
  const logger = /*#__PURE__*/ createLogger('extendBaseUrl')
  const { baseUrl, defaultLocale } = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

  if (isFunction(baseUrl)) {
    return (): string => {
      __DEBUG__ && logger.log('using localeLoader function -', { baseUrlResult: baseUrl(nuxt) })
      return baseUrl(nuxt)
    }
  }

  const localeCode = isFunction(defaultLocale)
    ? /*#__PURE__*/ (defaultLocale as unknown as () => string)()
    : defaultLocale
  return (): string => {
    if (__DIFFERENT_DOMAINS__ && localeCode) {
      const domain = getDomainFromLocale(localeCode)
      if (domain) {
        return domain
      }
    }

    __DEBUG__ && logger.log('using runtimeConfig -', { baseUrl })

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
  const composer = getComposer(ctx.getVueI18n())

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

      await ctx.loadLocaleMessages(k)
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

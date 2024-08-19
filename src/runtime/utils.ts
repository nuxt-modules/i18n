/* eslint-disable @typescript-eslint/no-explicit-any */
import { joinURL, isEqual } from 'ufo'
import { isString, isFunction, isObject } from '@intlify/shared'
import { navigateTo, useNuxtApp, useRouter, useRuntimeConfig, useState } from '#imports'
import { NUXT_I18N_MODULE_ID, isSSG, localeLoaders, normalizedLocales } from '#build/i18n.options.mjs'
import {
  wrapComposable,
  detectBrowserLanguage,
  defineGetter,
  getLocaleDomain,
  getDomainFromLocale,
  runtimeDetectBrowserLanguage,
  getHost,
  DetectFailure
} from './internal'
import { loadLocale, makeFallbackLocaleCodes } from './messages'
import {
  localeHead,
  localePath,
  localeRoute,
  getRouteBaseName,
  switchLocalePath,
  DefaultPrefixable,
  DefaultSwitchLocalePathIntercepter
} from './routing/compatibles'
import {
  getI18nProperty,
  getI18nTarget,
  getLocale,
  getLocaleCodes,
  mergeLocaleMessage,
  onBeforeLanguageSwitch,
  onLanguageSwitched,
  setLocaleProperty,
  setLocaleCookie
} from './compatibility'

import type { I18n, Locale } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { Ref } from '#imports'
import type { Router } from '#vue-router'
import type { DetectLocaleContext } from './internal'
import type { HeadSafe } from '@unhead/vue'
import { createLocaleFromRouteGetter, type GetLocaleFromRouteFunction } from './routing/extends/router'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import type { RuntimeConfig } from '@nuxt/schema'
import type { ModulePublicRuntimeConfig } from '../module'
import type {
  RootRedirectOptions,
  PrefixableOptions,
  SwitchLocalePathIntercepter,
  BaseUrlResolveHandler,
  LocaleObject
} from '#build/i18n.options.mjs'

/**
 * Common options used internally by composable functions, these
 * are initialized when calling a wrapped composable function.
 *
 * @internal
 */
export type CommonComposableOptions = {
  router: Router
  i18n: I18n
  runtimeConfig: RuntimeConfig
  metaState: Ref<Record<Locale, any>>
}
export function initCommonComposableOptions(i18n?: I18n): CommonComposableOptions {
  return {
    i18n: i18n ?? (useNuxtApp().$i18n as I18n),
    router: useRouter(),
    runtimeConfig: useRuntimeConfig(),
    metaState: useState<Record<Locale, any>>('nuxt-i18n-meta', () => ({}))
  }
}

export async function loadAndSetLocale(
  newLocale: Locale,
  i18n: I18n,
  runtimeI18n: ModulePublicRuntimeConfig['i18n'],
  initial: boolean = false
): Promise<boolean> {
  const { differentDomains, skipSettingLocaleOnNavigate, lazy } = runtimeI18n
  const opts = runtimeDetectBrowserLanguage(runtimeI18n)
  const nuxtApp = useNuxtApp()

  const oldLocale = getLocale(i18n)
  const localeCodes = getLocaleCodes(i18n)

  // sets the locale cookie if unset or not up to date
  function syncCookie(locale: Locale = oldLocale) {
    if (opts === false || !opts.useCookie) return
    if (skipSettingLocaleOnNavigate) return

    setLocaleCookie(i18n, locale)
  }

  __DEBUG__ && console.log('setLocale: new -> ', newLocale, ' old -> ', oldLocale, ' initial -> ', initial)

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

  // call `onBeforeLanguageSwitch` which may return an override for `newLocale`
  const localeOverride = await onBeforeLanguageSwitch(i18n, oldLocale, newLocale, initial, nuxtApp)
  if (localeOverride && localeCodes.includes(localeOverride)) {
    // resolved `localeOverride` is already in use
    if (oldLocale === localeOverride) {
      syncCookie()
      return false
    }

    newLocale = localeOverride
  }

  // load locale messages required by `newLocale`
  if (lazy) {
    const i18nFallbackLocales = getI18nProperty(i18n, 'fallbackLocale')

    const setter = mergeLocaleMessage.bind(null, i18n)
    if (i18nFallbackLocales) {
      const fallbackLocales = makeFallbackLocaleCodes(i18nFallbackLocales, [newLocale])
      await Promise.all(fallbackLocales.map(locale => loadLocale(locale, localeLoaders, setter)))
    }
    await loadLocale(newLocale, localeLoaders, setter)
  }

  if (skipSettingLocaleOnNavigate) {
    return false
  }

  // sync cookie and set the locale
  syncCookie(newLocale)
  setLocaleProperty(i18n, newLocale)

  await onLanguageSwitched(i18n, oldLocale, newLocale)

  return true
}

type LocaleLoader = () => Locale

/**
 * Used for runtime debug logs only
 */
export function createLogger(label: string) {
  return {
    log: console.log.bind(console, `${label}:`)
    // change to this after implementing logger across runtime code
    // log: console.log.bind(console, `[i18n:${label}]`)
  }
}

export function detectLocale(
  route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  routeLocaleGetter: GetLocaleFromRouteFunction,
  initialLocaleLoader: Locale | LocaleLoader,
  detectLocaleContext: DetectLocaleContext,
  runtimeI18n: ModulePublicRuntimeConfig['i18n']
) {
  const { strategy, defaultLocale, differentDomains, multiDomainLocales } = runtimeI18n
  const { localeCookie } = detectLocaleContext
  const _detectBrowserLanguage = runtimeDetectBrowserLanguage(runtimeI18n)
  const logger = createLogger('detectLocale')

  const initialLocale = isFunction(initialLocaleLoader) ? initialLocaleLoader() : initialLocaleLoader
  __DEBUG__ && logger.log({ initialLocale })

  const detectedBrowser = detectBrowserLanguage(route, detectLocaleContext, initialLocale)
  __DEBUG__ && logger.log({ detectBrowserLanguage: detectedBrowser })

  if (detectedBrowser.reason === DetectFailure.SSG_IGNORE) {
    return initialLocale
  }

  // detected browser language
  if (detectedBrowser.locale && detectedBrowser.from != null) {
    return detectedBrowser.locale
  }

  let detected: string = ''
  __DEBUG__ && logger.log('1/3', { detected, strategy })

  // detect locale by route
  if (differentDomains || multiDomainLocales) {
    detected ||= getLocaleDomain(normalizedLocales, strategy, route)
  } else if (strategy !== 'no_prefix') {
    detected ||= routeLocaleGetter(route)
  }

  __DEBUG__ && logger.log('2/3', { detected, detectBrowserLanguage: _detectBrowserLanguage })

  const cookieLocale = _detectBrowserLanguage && _detectBrowserLanguage.useCookie && localeCookie
  detected ||= cookieLocale || initialLocale || defaultLocale || ''

  __DEBUG__ && logger.log('3/3', { detected, cookieLocale, initialLocale, defaultLocale })

  return detected
}

export function detectRedirect({
  route,
  targetLocale,
  routeLocaleGetter,
  calledWithRouting = false
}: {
  route: {
    to: RouteLocationNormalized | RouteLocationNormalizedLoaded
    from?: RouteLocationNormalized | RouteLocationNormalizedLoaded
  }
  targetLocale: Locale
  routeLocaleGetter: GetLocaleFromRouteFunction
  calledWithRouting?: boolean
}): string {
  const nuxtApp = useNuxtApp()
  const common = initCommonComposableOptions()
  const { strategy, differentDomains } = common.runtimeConfig.public.i18n
  __DEBUG__ && console.log('detectRedirect: targetLocale -> ', targetLocale)
  __DEBUG__ && console.log('detectRedirect: route -> ', route)
  __DEBUG__ && console.log('detectRedirect: calledWithRouting -> ', calledWithRouting, routeLocaleGetter(route.to))

  let redirectPath = ''
  const { fullPath: toFullPath } = route.to
  const isStaticGenerate = isSSG && import.meta.server

  /**
   * decide whether we should redirect to a different route.
   *
   * NOTE: #2288
   * If this function is called directly (e.g setLocale) than routing,
   * it must be processed regardless of the strategy. because the route is not switched.
   */
  if (
    !isStaticGenerate &&
    !differentDomains &&
    (calledWithRouting || strategy !== 'no_prefix') &&
    routeLocaleGetter(route.to) !== targetLocale
  ) {
    // the current route could be 404 in which case attempt to find matching route using the full path
    const routePath = nuxtApp.$switchLocalePath(targetLocale) || nuxtApp.$localePath(toFullPath, targetLocale)
    __DEBUG__ && console.log('detectRedirect: calculate routePath -> ', routePath, toFullPath)
    if (isString(routePath) && routePath && !isEqual(routePath, toFullPath) && !routePath.startsWith('//')) {
      /**
       * NOTE: for #1889, #2226
       * If it's the same as the previous route path, respect the current route without redirecting.
       * (If an empty string is set, the current route is respected. after this function return, it's pass navigate function)
       */
      redirectPath = !(route.from && route.from.fullPath === routePath) ? routePath : ''
    }
  }

  if ((differentDomains || (isSSG && import.meta.client)) && routeLocaleGetter(route.to) !== targetLocale) {
    /**
     * `$router.currentRoute` does not yet reflect the `to` value,
     *  when the Router middleware handler is executed.
     *  if `$switchLocalePath` is called, the intended path cannot be obtained,
     *  because it is processed by previso's route.
     *  so, we don't call that function, and instead, we call `useSwitchLocalePath`,
     *  let it be processed by the route of the router middleware.
     */
    const routePath = switchLocalePath(common, targetLocale, route.to)
    __DEBUG__ && console.log('detectRedirect: calculate domain or ssg routePath -> ', routePath)
    if (isString(routePath) && routePath && !isEqual(routePath, toFullPath) && !routePath.startsWith('//')) {
      redirectPath = routePath
    }
  }

  return redirectPath
}

function isRootRedirectOptions(rootRedirect: unknown): rootRedirect is RootRedirectOptions {
  return isObject(rootRedirect) && 'path' in rootRedirect && 'statusCode' in rootRedirect
}

// composable function for redirect loop avoiding
const useRedirectState = () => useState<string>(NUXT_I18N_MODULE_ID + ':redirect', () => '')

type NavigateArgs = {
  nuxtApp: NuxtApp
  i18n: I18n
  redirectPath: string
  locale: string
  route: RouteLocationNormalized | RouteLocationNormalizedLoaded
}

function _navigate(redirectPath: string, status: number) {
  return navigateTo(redirectPath, { redirectCode: status })
}

export async function navigate(
  args: NavigateArgs,
  { status = 302, enableNavigate = false }: { status?: number; enableNavigate?: boolean } = {}
) {
  const { nuxtApp, i18n, locale, route } = args
  const { rootRedirect, differentDomains, multiDomainLocales, skipSettingLocaleOnNavigate, configLocales, strategy } =
    nuxtApp.$config.public.i18n
  let { redirectPath } = args

  __DEBUG__ &&
    console.log(
      'navigate options ',
      status,
      rootRedirect,
      differentDomains,
      skipSettingLocaleOnNavigate,
      enableNavigate
    )
  __DEBUG__ && console.log('navigate isSSG', isSSG)

  if (route.path === '/' && rootRedirect) {
    if (isString(rootRedirect)) {
      redirectPath = '/' + rootRedirect
    } else if (isRootRedirectOptions(rootRedirect)) {
      redirectPath = '/' + rootRedirect.path
      status = rootRedirect.statusCode
    }
    redirectPath = nuxtApp.$localePath(redirectPath, locale)
    __DEBUG__ && console.log('navigate: rootRedirect mode redirectPath -> ', redirectPath, ' status -> ', status)
    return _navigate(redirectPath, status)
  }

  if (import.meta.client && skipSettingLocaleOnNavigate) {
    i18n.__pendingLocale = locale
    i18n.__pendingLocalePromise = new Promise(resolve => {
      i18n.__resolvePendingLocalePromise = resolve
    })
    if (!enableNavigate) {
      return
    }
  }

  if (multiDomainLocales && strategy === 'prefix_except_default') {
    const host = getHost()
    const currentDomain = configLocales.find(locale => {
      if (typeof locale !== 'string') {
        return locale.defaultForDomains?.find(domain => domain === host)
      }

      return false
    })
    const defaultLocaleForDomain = typeof currentDomain !== 'string' ? currentDomain?.code : undefined

    if (route.path.startsWith(`/${defaultLocaleForDomain}`)) {
      return _navigate(route.path.replace(`/${defaultLocaleForDomain}`, ''), status)
    } else if (!route.path.startsWith(`/${locale}`) && locale !== defaultLocaleForDomain) {
      const getLocaleFromRoute = createLocaleFromRouteGetter()
      const oldLocale = getLocaleFromRoute(route.path)

      if (oldLocale !== '') {
        return _navigate(`/${locale + route.path.replace(`/${oldLocale}`, '')}`, status)
      } else {
        return _navigate(`/${locale + (route.path === '/' ? '' : route.path)}`, status)
      }
    } else if (redirectPath && route.path !== redirectPath) {
      return _navigate(redirectPath, status)
    }

    return
  }

  if (!differentDomains) {
    if (redirectPath) {
      return _navigate(redirectPath, status)
    }
  } else {
    const state = useRedirectState()
    __DEBUG__ && console.log('redirect state ->', state.value, 'redirectPath -> ', redirectPath)
    if (state.value && state.value !== redirectPath) {
      if (import.meta.client) {
        state.value = '' // reset redirect path
        window.location.assign(redirectPath)
      } else if (import.meta.server) {
        __DEBUG__ && console.log('differentDomains servermode ', redirectPath)
        state.value = redirectPath // set redirect path
      }
    }
  }
}

export function injectNuxtHelpers(nuxt: NuxtApp, i18n: I18n) {
  /**
   * NOTE:
   *  we will inject `i18n.global` to **nuxt app instance only**
   *  as vue-i18n has already been injected into vue,
   *
   *  implementation borrowed from
   *  https://github.com/nuxt/nuxt/blob/a995f724eadaa06d5443b188879ac18dfe73de2e/packages/nuxt/src/app/nuxt.ts#L295-L299
   */
  defineGetter(nuxt, '$i18n', getI18nTarget(i18n))
  defineGetter(nuxt, '$getRouteBaseName', wrapComposable(getRouteBaseName))
  defineGetter(nuxt, '$localePath', wrapComposable(localePath))
  defineGetter(nuxt, '$localeRoute', wrapComposable(localeRoute))
  defineGetter(nuxt, '$switchLocalePath', wrapComposable(switchLocalePath))
  defineGetter(nuxt, '$localeHead', wrapComposable(localeHead))
}

// override prefix for route path, support domain
export function extendPrefixable(runtimeConfig = useRuntimeConfig()) {
  return (opts: PrefixableOptions): boolean => {
    __DEBUG__ && console.log('extendPrefixable', DefaultPrefixable(opts))

    return DefaultPrefixable(opts) && !runtimeConfig.public.i18n.differentDomains
  }
}

// override switch locale path intercepter, support domain
export function extendSwitchLocalePathIntercepter(runtimeConfig = useRuntimeConfig()): SwitchLocalePathIntercepter {
  return (path: string, locale: Locale): string => {
    if (runtimeConfig.public.i18n.differentDomains) {
      const domain = getDomainFromLocale(locale)
      __DEBUG__ && console.log('extendSwitchLocalePathIntercepter: domain -> ', domain, ' path -> ', path)
      if (domain) {
        return joinURL(domain, path)
      } else {
        return path
      }
    } else {
      return DefaultSwitchLocalePathIntercepter(path, locale)
    }
  }
}

export function extendBaseUrl(): BaseUrlResolveHandler<NuxtApp> {
  return (): string => {
    const ctx = useNuxtApp()
    const { baseUrl, defaultLocale, differentDomains } = ctx.$config.public.i18n

    if (isFunction(baseUrl)) {
      const baseUrlResult = baseUrl(ctx)
      __DEBUG__ && console.log('baseUrl: using localeLoader function -', baseUrlResult)
      return baseUrlResult
    }

    const localeCode = isFunction(defaultLocale) ? (defaultLocale() as string) : defaultLocale
    if (differentDomains && localeCode) {
      const domain = getDomainFromLocale(localeCode)
      if (domain) {
        __DEBUG__ && console.log('baseUrl: using differentDomains -', domain)
        return domain
      }
    }

    if (baseUrl) {
      __DEBUG__ && console.log('baseUrl: using runtimeConfig -', baseUrl)
      return baseUrl
    }

    return baseUrl!
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
export type HeadParam = Required<Pick<HeadSafe, 'meta' | 'link'>>
export function getNormalizedLocales(locales: string[] | LocaleObject[]): LocaleObject[] {
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale })
      continue
    }
    normalized.push(locale)
  }
  return normalized
}

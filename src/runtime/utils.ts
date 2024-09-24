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
import { localeHead } from './routing/compatibles/head'
import {
  localePath,
  localeRoute,
  getRouteBaseName,
  switchLocalePath,
  DefaultPrefixable
} from './routing/compatibles/routing'
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
import { createLogger } from 'virtual:nuxt-i18n-logger'
import { createLocaleFromRouteGetter } from './routing/extends/router'

import type { I18n, Locale } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { Ref } from '#imports'
import type { Router } from '#vue-router'
import type { DetectLocaleContext } from './internal'
import type { HeadSafe } from '@unhead/vue'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import type { RuntimeConfig } from 'nuxt/schema'
import type { I18nPublicRuntimeConfig } from './shared-types'
import type {
  RootRedirectOptions,
  PrefixableOptions,
  SwitchLocalePathIntercepter,
  BaseUrlResolveHandler,
  Strategies,
  LocaleObject
} from './shared-types'

/**
 * Common options used internally by composable functions, these
 * are initialized when calling a wrapped composable function.
 *
 * @internal
 */
export type CommonComposableOptions = {
  router: Router
  i18n: I18n
  runtimeConfig: RuntimeConfig & { public: { i18n: I18nPublicRuntimeConfig } }
  metaState: Ref<Record<Locale, any>>
}
export function initCommonComposableOptions(i18n?: I18n): CommonComposableOptions {
  return {
    i18n: i18n ?? (useNuxtApp().$i18n as unknown as I18n),
    router: useRouter(),
    runtimeConfig: useRuntimeConfig() as RuntimeConfig & { public: { i18n: I18nPublicRuntimeConfig } },
    metaState: useState<Record<Locale, any>>('nuxt-i18n-meta', () => ({}))
  }
}

export async function loadAndSetLocale(
  newLocale: Locale,
  i18n: I18n,
  runtimeI18n: I18nPublicRuntimeConfig,
  initial: boolean = false
): Promise<boolean> {
  const logger = /*#__PURE__*/ createLogger('loadAndSetLocale')
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

export function detectLocale(
  route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  routeLocale: string,
  initialLocaleLoader: Locale | LocaleLoader,
  detectLocaleContext: DetectLocaleContext,
  runtimeI18n: I18nPublicRuntimeConfig
) {
  const { strategy, defaultLocale, differentDomains, multiDomainLocales } = runtimeI18n
  const { localeCookie } = detectLocaleContext
  const _detectBrowserLanguage = runtimeDetectBrowserLanguage(runtimeI18n)
  const logger = /*#__PURE__*/ createLogger('detectLocale')

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
    detected ||= routeLocale
  }

  __DEBUG__ && logger.log('2/3', { detected, detectBrowserLanguage: _detectBrowserLanguage })

  const cookieLocale = _detectBrowserLanguage && _detectBrowserLanguage.useCookie && localeCookie
  detected ||= cookieLocale || initialLocale || defaultLocale || ''

  __DEBUG__ && logger.log('3/3', { detected, cookieLocale, initialLocale, defaultLocale })

  return detected
}

type DetectRedirectOptions = {
  route: {
    to: RouteLocationNormalized | RouteLocationNormalizedLoaded
    from?: RouteLocationNormalized | RouteLocationNormalizedLoaded
  }
  /**
   * The locale we want to navigate to
   */
  locale: Locale
  /**
   * Locale detected from route
   */
  routeLocale: string
  strategy: Strategies
}

/**
 * Returns a localized path to redirect to, or an empty string if no redirection should occur
 *
 * @param inMiddleware - whether this is called during navigation middleware
 */
export function detectRedirect(
  { route, locale, routeLocale, strategy }: DetectRedirectOptions,
  inMiddleware = false
): string {
  // no locale change detected from routing
  if (routeLocale === locale || strategy === 'no_prefix') {
    return ''
  }

  /**
   * `$switchLocalePath` and `$localePath` functions internally use `$router.currentRoute`
   * instead we use composable internals which allows us to pass the `to` route from navigation middleware.
   */
  const common = initCommonComposableOptions()
  const logger = /*#__PURE__*/ createLogger('detectRedirect')

  __DEBUG__ && logger.log({ route })
  __DEBUG__ && logger.log({ locale, routeLocale, inMiddleware })

  let redirectPath = switchLocalePath(common, locale, route.to)

  // if current route is a 404 we attempt to find a matching route using the full path
  if (inMiddleware && !redirectPath) {
    redirectPath = localePath(common, route.to.fullPath, locale)
  }

  // NOTE: #1889, #2226 if resolved route is the same as current route, skip redirection by returning empty string value
  if (isEqual(redirectPath, route.to.fullPath) || (route.from && isEqual(redirectPath, route.from.fullPath))) {
    return ''
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
  const { rootRedirect, differentDomains, multiDomainLocales, skipSettingLocaleOnNavigate, locales, strategy } = nuxtApp
    .$config.public.i18n as I18nPublicRuntimeConfig
  const logger = /*#__PURE__*/ createLogger('navigate')
  let { redirectPath } = args

  __DEBUG__ &&
    logger.log('options', {
      status,
      rootRedirect,
      differentDomains,
      skipSettingLocaleOnNavigate,
      enableNavigate,
      isSSG
    })

  if (route.path === '/' && rootRedirect) {
    if (isString(rootRedirect)) {
      redirectPath = '/' + rootRedirect
    } else if (isRootRedirectOptions(rootRedirect)) {
      redirectPath = '/' + rootRedirect.path
      status = rootRedirect.statusCode
    }

    // TODO: resolve type errors for nuxt context extensions

    redirectPath = nuxtApp.$localePath(redirectPath, locale)
    __DEBUG__ && logger.log('rootRedirect mode', { redirectPath, status })
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
    const currentDomain = locales.find(locale => {
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
    __DEBUG__ && logger.log('redirect', { state: state.value, redirectPath })
    if (state.value && state.value !== redirectPath) {
      if (import.meta.client) {
        state.value = '' // reset redirect path
        window.location.assign(redirectPath)
      } else if (import.meta.server) {
        __DEBUG__ && logger.log('differentDomains servermode', { redirectPath })
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
  const logger = /*#__PURE__*/ createLogger('extendPrefixable')
  return (opts: PrefixableOptions): boolean => {
    __DEBUG__ && logger.log(DefaultPrefixable(opts))

    return DefaultPrefixable(opts) && !runtimeConfig.public.i18n.differentDomains
  }
}

// override switch locale path intercepter, support domain
export function extendSwitchLocalePathIntercepter(runtimeConfig = useRuntimeConfig()): SwitchLocalePathIntercepter {
  const logger = /*#__PURE__*/ createLogger('extendSwitchLocalePathIntercepter')

  return (path: string, locale: Locale): string => {
    if (!runtimeConfig.public.i18n.differentDomains) {
      return path
    }

    const domain = getDomainFromLocale(locale)
    __DEBUG__ && logger.log({ domain, path })
    return (domain && joinURL(domain, path)) || path
  }
}

export function extendBaseUrl(): BaseUrlResolveHandler<NuxtApp> {
  const logger = /*#__PURE__*/ createLogger('extendBaseUrl')
  return (): string => {
    const ctx = useNuxtApp()
    const { baseUrl, defaultLocale, differentDomains } = ctx.$config.public.i18n as I18nPublicRuntimeConfig

    if (isFunction(baseUrl)) {
      const baseUrlResult = baseUrl(ctx)
      __DEBUG__ && logger.log('using localeLoader function -', { baseUrlResult })
      return baseUrlResult
    }

    const localeCode = isFunction(defaultLocale) ? (defaultLocale() as string) : defaultLocale
    if (differentDomains && localeCode) {
      const domain = getDomainFromLocale(localeCode)
      if (domain) {
        __DEBUG__ && logger.log('using differentDomains -', { domain })
        return domain
      }
    }

    if (baseUrl) {
      __DEBUG__ && logger.log('using runtimeConfig -', { baseUrl })
      return baseUrl
    }

    // @ts-expect-error all cases are already handled
    return baseUrl
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

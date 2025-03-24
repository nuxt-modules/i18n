/* eslint-disable @typescript-eslint/no-explicit-any */
import { joinURL, isEqual } from 'ufo'
import { isFunction } from '@intlify/shared'
import { navigateTo, useNuxtApp, useRouter, useRuntimeConfig, useState } from '#imports'
import {
  NUXT_I18N_MODULE_ID,
  isSSG,
  localeCodes,
  localeLoaders,
  normalizedLocales,
  vueI18nConfigs
} from '#build/i18n.options.mjs'
import {
  detectBrowserLanguage,
  getLocaleDomain,
  getDomainFromLocale,
  runtimeDetectBrowserLanguage,
  getHost
} from './internal'
import { loadAndSetLocaleMessages, loadLocale, loadVueI18nOptions, makeFallbackLocaleCodes } from './messages'
import { localePath, switchLocalePath } from './routing/routing'
import { createLogger } from '#nuxt-i18n/logger'
import { unref } from 'vue'

import type { I18n, Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { Ref } from '#imports'
import type { Router } from '#vue-router'
import type { RuntimeConfig } from 'nuxt/schema'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { PrefixableOptions, SwitchLocalePathIntercepter, BaseUrlResolveHandler } from '#internal-i18n-types'
import type { CompatRoute } from './types'
import { createLocaleFromRouteGetter } from './routing/utils'
import { getComposer } from './compatibility'

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
  const common = initCommonComposableOptions()
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
  nuxtApp: NuxtApp
  redirectPath: string
  locale: string
  route: CompatRoute
}

export async function navigate({ nuxtApp, locale, route, redirectPath }: NavigateArgs, enableNavigate = false) {
  const { rootRedirect, differentDomains, multiDomainLocales, skipSettingLocaleOnNavigate, locales, strategy } = nuxtApp
    .$config.public.i18n as I18nPublicRuntimeConfig
  const logger = /*#__PURE__*/ createLogger('navigate')

  __DEBUG__ &&
    logger.log('options', { rootRedirect, differentDomains, skipSettingLocaleOnNavigate, enableNavigate, isSSG })

  if (route.path === '/' && rootRedirect) {
    let redirectCode = 302
    if (typeof rootRedirect === 'string') {
      redirectPath = '/' + rootRedirect
    } else {
      redirectPath = '/' + rootRedirect.path
      redirectCode = rootRedirect.statusCode
    }

    redirectPath = nuxtApp.$localePath(redirectPath, locale)
    __DEBUG__ && logger.log('rootRedirect mode', { redirectPath, redirectCode })
    return navigateTo(redirectPath, { redirectCode })
  }

  if (import.meta.client && skipSettingLocaleOnNavigate) {
    nuxtApp._vueI18n.__pendingLocale = locale
    nuxtApp._vueI18n.__pendingLocalePromise = new Promise(resolve => {
      nuxtApp._vueI18n.__resolvePendingLocalePromise = () => resolve()
    })
    if (!enableNavigate) {
      return
    }
  }

  if (multiDomainLocales && strategy === 'prefix_except_default') {
    const host = getHost()
    const currentDomain = locales.find(locale => {
      if (typeof locale === 'string') return
      return locale.defaultForDomains?.find(domain => domain === host)
    })

    const defaultLocaleForDomain = typeof currentDomain !== 'string' ? currentDomain?.code : undefined

    if (route.path.startsWith(`/${defaultLocaleForDomain}`)) {
      return navigateTo(route.path.replace(`/${defaultLocaleForDomain}`, ''))
    }

    if (!route.path.startsWith(`/${locale}`) && locale !== defaultLocaleForDomain) {
      const getLocaleFromRoute = createLocaleFromRouteGetter()
      const oldLocale = getLocaleFromRoute(route.path)

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

function prefixable({ currentLocale, defaultLocale, strategy }: PrefixableOptions): boolean {
  return (
    // strategy has no prefixes
    strategy !== 'no_prefix' &&
    // strategy should not prefix default locale
    !(currentLocale === defaultLocale && (strategy === 'prefix_and_default' || strategy === 'prefix_except_default'))
  )
}

// override prefix for route path, support domain
export function extendPrefixable(runtimeConfig = useRuntimeConfig()) {
  const logger = /*#__PURE__*/ createLogger('extendPrefixable')
  return (opts: PrefixableOptions): boolean => {
    const _prefixable = prefixable(opts)
    __DEBUG__ && logger.log(_prefixable)
    return _prefixable && !runtimeConfig.public.i18n.differentDomains
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

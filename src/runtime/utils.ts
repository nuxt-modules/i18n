/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getLocale,
  setLocale,
  getLocaleCodes,
  createLocaleFromRouteGetter,
  getRouteBaseName,
  localePath,
  localeRoute,
  switchLocalePath,
  localeHead,
  LocaleObject,
  DefaultPrefixable,
  DefaultSwitchLocalePathIntercepter,
  getComposer,
  useSwitchLocalePath
} from 'vue-i18n-routing'
import { navigateTo, useState } from '#imports'
import { isString, isFunction, isArray, isObject } from '@intlify/shared'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault, NUXT_I18N_MODULE_ID, isSSG } from '#build/i18n.options.mjs'
import {
  detectBrowserLanguage,
  getLocaleCookie,
  callVueI18nInterfaces,
  getVueI18nPropertyValue,
  loadLocale,
  defineGetter,
  getLocaleDomain,
  getDomainFromLocale,
  proxyNuxt,
  DefaultDetectBrowserLanguageFromResult
} from '#build/i18n.internal.mjs'
import { joinURL, isEqual } from 'ufo'

import type {
  Route,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  BaseUrlResolveHandler,
  PrefixableOptions,
  SwitchLocalePathIntercepter
} from 'vue-i18n-routing'
import type { NuxtApp } from '#app'
import type { I18n, Locale, FallbackLocale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { NuxtI18nOptions, DetectBrowserLanguageOptions, RootRedirectOptions } from '#build/i18n.options.mjs'
import type { DetectLocaleContext } from '#build/i18n.internal.mjs'
import type { DeepRequired } from 'ts-essentials'

export function _setLocale(i18n: I18n, locale: Locale) {
  return callVueI18nInterfaces(i18n, 'setLocale', locale)
}

export function setCookieLocale(i18n: I18n, locale: Locale) {
  return callVueI18nInterfaces(i18n, 'setLocaleCookie', locale)
}

export function setLocaleMessage(i18n: I18n, locale: Locale, messages: Record<string, any>) {
  return callVueI18nInterfaces(i18n, 'setLocaleMessage', locale, messages)
}

export function mergeLocaleMessage(i18n: I18n, locale: Locale, messages: Record<string, any>) {
  return callVueI18nInterfaces(i18n, 'mergeLocaleMessage', locale, messages)
}

function onBeforeLanguageSwitch(
  i18n: I18n,
  oldLocale: string,
  newLocale: string,
  initial: boolean,
  context: NuxtApp
): string | void {
  return callVueI18nInterfaces(i18n, 'onBeforeLanguageSwitch', oldLocale, newLocale, initial, context)
}

export function onLanguageSwitched(i18n: I18n, oldLocale: string, newLocale: string): void {
  return callVueI18nInterfaces(i18n, 'onLanguageSwitched', oldLocale, newLocale)
}

export async function finalizePendingLocaleChange(i18n: I18n) {
  return callVueI18nInterfaces(i18n, 'finalizePendingLocaleChange')
}

function makeFallbackLocaleCodes(fallback: FallbackLocale, locales: Locale[]): Locale[] {
  let fallbackLocales: string[] = []
  if (isArray(fallback)) {
    fallbackLocales = fallback
  } else if (isObject(fallback)) {
    const targets = [...locales, 'default']
    for (const locale of targets) {
      if (fallback[locale]) {
        fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)]
      }
    }
  } else if (isString(fallback) && locales.every(locale => locale !== fallback)) {
    fallbackLocales.push(fallback)
  }
  return fallbackLocales
}

export async function loadInitialMessages<Context extends NuxtApp = NuxtApp>(
  context: Context,
  messages: LocaleMessages<DefineLocaleMessage>,
  options: DeepRequired<NuxtI18nOptions<Context>> & {
    initialLocale: Locale
    fallbackLocale: FallbackLocale
    localeCodes: string[]
  }
): Promise<Record<string, any>> {
  const { defaultLocale, initialLocale, localeCodes, fallbackLocale, lazy } = options
  const setter = (locale: Locale, message: Record<string, any>) => {
    const base = messages[locale] || {}
    messages[locale] = { ...base, ...message }
  }

  // load fallback messages
  if (lazy && fallbackLocale) {
    const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [defaultLocale, initialLocale])
    await Promise.all(fallbackLocales.map(locale => loadLocale(context, locale, setter)))
  }

  // load initial messages
  const locales = lazy ? [...new Set<Locale>().add(defaultLocale).add(initialLocale)] : localeCodes
  await Promise.all(locales.map(locale => loadLocale(context, locale, setter)))

  return messages
}

export async function loadAndSetLocale<Context extends NuxtApp = NuxtApp>(
  newLocale: string,
  context: Context,
  i18n: I18n,
  {
    useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    skipSettingLocaleOnNavigate = nuxtI18nOptionsDefault.skipSettingLocaleOnNavigate,
    differentDomains = nuxtI18nOptionsDefault.differentDomains,
    initial = false,
    lazy = false
  }: Pick<DetectBrowserLanguageOptions, 'useCookie'> &
    Pick<NuxtI18nOptions<Context>, 'lazy' | 'skipSettingLocaleOnNavigate' | 'differentDomains'> & {
      initial?: boolean
    } = {}
): Promise<[boolean, string]> {
  let ret = false
  const oldLocale = getLocale(i18n)
  __DEBUG__ && console.log('setLocale: new -> ', newLocale, ' old -> ', oldLocale, ' initial -> ', initial)
  if (!newLocale) {
    return [ret, oldLocale]
  }

  // abort if different domains option enabled
  if (!initial && differentDomains) {
    return [ret, oldLocale]
  }

  if (oldLocale === newLocale) {
    return [ret, oldLocale]
  }

  // call onBeforeLanguageSwitch
  const localeOverride = await onBeforeLanguageSwitch(i18n, oldLocale, newLocale, initial, context)
  const localeCodes = getLocaleCodes(i18n)
  if (localeOverride && localeCodes && localeCodes.includes(localeOverride)) {
    if (localeOverride === oldLocale) {
      return [ret, oldLocale]
    }
    newLocale = localeOverride
  }

  const i18nFallbackLocales = getVueI18nPropertyValue<FallbackLocale>(i18n, 'fallbackLocale')
  if (lazy) {
    const setter = (locale: Locale, message: Record<string, any>) => mergeLocaleMessage(i18n, locale, message)
    if (i18nFallbackLocales) {
      const fallbackLocales = makeFallbackLocaleCodes(i18nFallbackLocales, [newLocale])
      await Promise.all(fallbackLocales.map(locale => loadLocale(context, locale, setter)))
    }
    await loadLocale(context, newLocale, setter)
  }

  if (skipSettingLocaleOnNavigate) {
    return [ret, oldLocale]
  }

  // set the locale
  if (useCookie) {
    setCookieLocale(i18n, newLocale)
  }
  setLocale(i18n, newLocale)

  await onLanguageSwitched(i18n, oldLocale, newLocale)

  ret = true
  return [ret, oldLocale]
}

type LocaleLoader = () => Locale

export function detectLocale<Context extends NuxtApp = NuxtApp>(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any,
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>,
  initialLocaleLoader: Locale | LocaleLoader,
  detectLocaleContext: DetectLocaleContext,
  normalizedLocales: LocaleObject[],
  localeCodes: string[] = []
) {
  const { strategy, defaultLocale, differentDomains } = nuxtI18nOptions

  const initialLocale = isFunction(initialLocaleLoader) ? initialLocaleLoader() : initialLocaleLoader
  __DEBUG__ && console.log('detectLocale: initialLocale -', initialLocale)

  const { ssg, callType, firstAccess } = detectLocaleContext
  __DEBUG__ && console.log('detectLocale: (ssg, callType, firstAccess) - ', ssg, callType, firstAccess)

  // prettier-ignore
  const { locale: browserLocale, stat, reason, from } = nuxtI18nOptions.detectBrowserLanguage
    ? detectBrowserLanguage(route, context, nuxtI18nOptions, nuxtI18nInternalOptions, detectLocaleContext, localeCodes, initialLocale)
    : DefaultDetectBrowserLanguageFromResult
  __DEBUG__ &&
    console.log(
      'detectLocale: detectBrowserLanguage (browserLocale, stat, reason, from) -',
      browserLocale,
      stat,
      reason,
      from
    )

  if (reason === 'detect_ignore_on_ssg') {
    return initialLocale
  }

  /**
   * respect the locale detected by `detectBrowserLanguage`
   */
  if ((from === 'navigator_or_header' || from === 'cookie' || from === 'fallback') && browserLocale) {
    return browserLocale
  }

  let finalLocale: string = browserLocale
  __DEBUG__ && console.log('detectLocale: finaleLocale first (finaleLocale, strategy) -', finalLocale, strategy)

  if (!finalLocale) {
    if (differentDomains) {
      finalLocale = getLocaleDomain(normalizedLocales)
    } else if (strategy !== 'no_prefix') {
      finalLocale = routeLocaleGetter(route)
    } else {
      if (!nuxtI18nOptions.detectBrowserLanguage) {
        finalLocale = initialLocale
      }
    }
  }

  __DEBUG__ &&
    console.log(
      'detectLocale: finaleLocale second (finaleLocale, detectBrowserLanguage) -',
      finalLocale,
      nuxtI18nOptions.detectBrowserLanguage
    )
  if (!finalLocale && nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie) {
    finalLocale = getLocaleCookie(context, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes }) || ''
  }

  __DEBUG__ && console.log('detectLocale: finalLocale last (finalLocale, defaultLocale) -', finalLocale, defaultLocale)
  if (!finalLocale) {
    finalLocale = defaultLocale || ''
  }

  __DEBUG__ && console.log('detectLocale: finalLocale -', finalLocale)
  return finalLocale
}

export function detectRedirect<Context extends NuxtApp = NuxtApp>({
  route,
  context,
  targetLocale,
  routeLocaleGetter,
  nuxtI18nOptions,
  calledWithRouting = false
}: {
  route: {
    to: Route | RouteLocationNormalized | RouteLocationNormalizedLoaded
    from?: Route | RouteLocationNormalized | RouteLocationNormalizedLoaded
  }
  context: Context
  targetLocale: Locale
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>
  calledWithRouting?: boolean
}): string {
  const { strategy, differentDomains } = nuxtI18nOptions
  __DEBUG__ && console.log('detectRedirect: targetLocale -> ', targetLocale)
  __DEBUG__ && console.log('detectRedirect: route -> ', route)
  __DEBUG__ && console.log('detectRedirect: calledWithRouting -> ', calledWithRouting, routeLocaleGetter(route.to))

  let redirectPath = ''
  const { fullPath: toFullPath } = route.to
  const isStaticGenerate = isSSG && process.server

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
    (calledWithRouting || (strategy !== 'no_prefix' && strategy !== 'prefix_and_default')) &&
    routeLocaleGetter(route.to) !== targetLocale
  ) {
    // the current route could be 404 in which case attempt to find matching route using the full path
    const routePath = context.$switchLocalePath(targetLocale) || context.$localePath(toFullPath, targetLocale)
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

  if ((differentDomains || (isSSG && process.client)) && routeLocaleGetter(route.to) !== targetLocale) {
    /**
     * `$router.currentRoute` does not yet reflect the `to` value,
     *  when the Router middleware handler is executed.
     *  if `$switchLocalePath` is called, the intended path cannot be obtained,
     *  because it is processed by previso's route.
     *  so, we don't call that function, and instead, we call `useSwitchLocalePath`,
     *  let it be processed by the route of the router middleware.
     */
    const switchLocalePath = useSwitchLocalePath({
      i18n: getComposer(context.$i18n),
      route: route.to,
      router: context.$router
    })
    const routePath = switchLocalePath(targetLocale)
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
  i18n: I18n
  redirectPath: string
  locale: string
  route: Route | RouteLocationNormalized | RouteLocationNormalizedLoaded
}

function _navigate(redirectPath: string, status: number) {
  return navigateTo(redirectPath, { redirectCode: status })
}

export async function navigate<Context extends NuxtApp = NuxtApp>(
  args: NavigateArgs,
  {
    status = 302,
    rootRedirect = nuxtI18nOptionsDefault.rootRedirect,
    differentDomains = nuxtI18nOptionsDefault.differentDomains,
    skipSettingLocaleOnNavigate = nuxtI18nOptionsDefault.skipSettingLocaleOnNavigate,
    enableNavigate = false
  }: {
    status?: number
    enableNavigate?: boolean
  } & Pick<NuxtI18nOptions<Context>, 'skipSettingLocaleOnNavigate' | 'differentDomains' | 'rootRedirect'> = {}
) {
  const { i18n, locale, route } = args
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
    __DEBUG__ && console.log('navigate: rootRedirect mode redirectPath -> ', redirectPath, ' status -> ', status)
    return _navigate(redirectPath, status)
  }

  if (process.client && skipSettingLocaleOnNavigate) {
    i18n.__pendingLocale = locale
    i18n.__pendingLocalePromise = new Promise(resolve => {
      i18n.__resolvePendingLocalePromise = resolve
    })
    if (!enableNavigate) {
      return
    }
  }

  if (!differentDomains) {
    if (redirectPath) {
      return _navigate(redirectPath, status)
    }
  } else {
    const state = useRedirectState()
    __DEBUG__ && console.log('redirect state ->', state.value, 'redirectPath -> ', redirectPath)
    if (state.value && state.value !== redirectPath) {
      if (process.client) {
        state.value = '' // reset redirect path
        window.location.assign(redirectPath)
      } else if (process.server) {
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
   *  because vue-i18n has already injected into vue,
   *  it's not necessary to do, so we borrow from nuxt inject implementation.
   */
  defineGetter(nuxt as any, '$i18n', i18n.global)

  for (const pair of [
    ['getRouteBaseName', getRouteBaseName],
    ['localePath', localePath],
    ['localeRoute', localeRoute],
    ['switchLocalePath', switchLocalePath],
    ['localeHead', localeHead]
  ]) {
    defineGetter(nuxt as any, '$' + pair[0], proxyNuxt(nuxt, pair[1] as (...args: any) => any))
  }
}

// override prefix for route path, support domain
export function extendPrefixable(differentDomains: boolean) {
  return (opts: PrefixableOptions): boolean => {
    return DefaultPrefixable(opts) && !differentDomains
  }
}

// override switch locale path intercepter, support domain
export function extendSwitchLocalePathIntercepter(
  differentDomains: boolean,
  normalizedLocales: LocaleObject[],
  nuxt: NuxtApp
): SwitchLocalePathIntercepter {
  return (path: string, locale: Locale): string => {
    if (differentDomains) {
      const domain = getDomainFromLocale(locale, normalizedLocales, nuxt)
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

export function extendBaseUrl<Context extends NuxtApp = NuxtApp>(
  baseUrl: string | BaseUrlResolveHandler<Context>,
  options: Pick<Required<NuxtI18nOptions<Context>>, 'differentDomains'> & {
    nuxt?: Context
    localeCodeLoader: Locale | LocaleLoader
    normalizedLocales: LocaleObject[]
  }
): BaseUrlResolveHandler<Context> {
  return (context: Context): string => {
    if (isFunction(baseUrl)) {
      const baseUrlResult = baseUrl(context)
      __DEBUG__ && console.log('baseUrl: using localeLoader function -', baseUrlResult)
      return baseUrlResult
    }

    const { differentDomains, localeCodeLoader, normalizedLocales } = options
    const localeCode = isFunction(localeCodeLoader) ? localeCodeLoader() : localeCodeLoader
    if (differentDomains && localeCode) {
      const domain = getDomainFromLocale(localeCode, normalizedLocales, options.nuxt)
      if (domain) {
        __DEBUG__ && console.log('baseUrl: using differentDomains -', domain)
        return domain
      }
    }

    const config = context.$config?.public?.i18n as { baseUrl?: string }
    if (config?.baseUrl) {
      __DEBUG__ && console.log('baseUrl: using runtimeConfig -', config.baseUrl)
      return config.baseUrl
    }

    return baseUrl
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

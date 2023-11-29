/* eslint-disable @typescript-eslint/no-explicit-any */
import { useI18n } from 'vue-i18n'
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
  DefaultPrefixable,
  DefaultSwitchLocalePathIntercepter,
  getComposer,
  useLocaleRoute,
  useRouteBaseName,
  useSwitchLocalePath,
  STRATEGIES
} from 'vue-i18n-routing'
import { joinURL, isEqual } from 'ufo'
import { isString, isFunction, isArray, isObject } from '@intlify/shared'
import { navigateTo, useRoute, useState } from '#imports'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault, NUXT_I18N_MODULE_ID, isSSG } from '#build/i18n.options.mjs'
import {
  detectBrowserLanguage,
  getLocaleCookie,
  callVueI18nInterfaces,
  getVueI18nPropertyValue,
  defineGetter,
  getLocaleDomain,
  getDomainFromLocale,
  proxyNuxt,
  DefaultDetectBrowserLanguageFromResult
} from './internal'
import { loadLocale, makeFallbackLocaleCodes } from './messages'

import type {
  Route,
  LocaleObject,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  BaseUrlResolveHandler,
  PrefixableOptions,
  SwitchLocalePathIntercepter,
  I18nHeadOptions
} from 'vue-i18n-routing'
import type { I18n, I18nOptions, Locale, FallbackLocale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { NuxtI18nOptions, DetectBrowserLanguageOptions, RootRedirectOptions } from '#build/i18n.options.mjs'
import type { DeepRequired } from 'ts-essentials'
import type { DetectLocaleContext } from './internal'
import type { LocaleLoader as LocaleInternalLoader } from './messages'
import type { HeadSafe } from '@unhead/vue'

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

export async function loadAndSetLocale<Context extends NuxtApp = NuxtApp>(
  newLocale: string,
  context: Context,
  localeMessages: Record<Locale, LocaleInternalLoader[]>,
  i18n: I18n,
  {
    useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    skipSettingLocaleOnNavigate = nuxtI18nOptionsDefault.skipSettingLocaleOnNavigate,
    differentDomains = nuxtI18nOptionsDefault.differentDomains,
    initial = false,
    cacheMessages = undefined,
    lazy = false
  }: Pick<DetectBrowserLanguageOptions, 'useCookie'> &
    Pick<NuxtI18nOptions<Context>, 'lazy' | 'skipSettingLocaleOnNavigate' | 'differentDomains'> & {
      initial?: boolean
      cacheMessages?: Map<string, LocaleMessages<DefineLocaleMessage>>
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
      await Promise.all(fallbackLocales.map(locale => loadLocale({ locale, setter, localeMessages }, cacheMessages)))
    }
    await loadLocale({ locale: newLocale, setter, localeMessages }, cacheMessages)
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
  vueI18nOptions: I18nOptions,
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
  const {
    locale: browserLocale,
    stat,
    reason,
    from
  } = nuxtI18nOptions.detectBrowserLanguage
    ? detectBrowserLanguage(
        route,
        context,
        nuxtI18nOptions,
        nuxtI18nInternalOptions,
        vueI18nOptions,
        detectLocaleContext,
        localeCodes,
        initialLocale
      )
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
    (calledWithRouting || strategy !== 'no_prefix') &&
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

export type HeadParam = Required<Pick<HeadSafe, 'htmlAttrs' | 'meta' | 'link'>>
type IdParam = NonNullable<I18nHeadOptions['identifierAttribute']>

export function addHreflangLinks(locales: LocaleObject[], head: HeadParam, idAttribute: IdParam) {
  const { defaultLocale, strategy, baseUrl } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  if (strategy === STRATEGIES.NO_PREFIX) {
    return
  }

  const localeMap = new Map<string, LocaleObject>()
  const links = []
  for (const locale of locales) {
    const localeIso = locale.iso

    if (!localeIso) {
      console.warn('Locale ISO code is required to generate alternate link')
      continue
    }

    const [language, region] = localeIso.split('-')
    if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
      localeMap.set(language, locale)
    }

    localeMap.set(localeIso, locale)
  }

  for (const [iso, mapLocale] of localeMap.entries()) {
    const localePath = switchLocalePath(mapLocale.code)
    if (localePath) {
      links.push({
        [idAttribute]: `i18n-alt-${iso}`,
        rel: 'alternate',
        href: toAbsoluteUrl(localePath, baseUrl.value),
        hreflang: iso
      })
    }
  }

  if (defaultLocale) {
    const localePath = switchLocalePath(defaultLocale)
    if (localePath) {
      links.push({
        [idAttribute]: 'i18n-xd',
        rel: 'alternate2',
        href: toAbsoluteUrl(localePath, baseUrl.value),
        hreflang: 'x-default'
      })
    }
  }

  head.link.push(...links)
}

export function addCanonicalLinksAndOgUrl(
  head: HeadParam,
  idAttribute: IdParam,
  seoAttributesOptions: I18nHeadOptions['addSeoAttributes']
) {
  const { baseUrl } = useI18n()
  const route = useRoute()
  const localeRoute = useLocaleRoute()
  const getRouteBaseName = useRouteBaseName()
  const currentRoute = localeRoute({ ...route, name: getRouteBaseName.call(route) })

  if (!currentRoute) return
  let href = toAbsoluteUrl(currentRoute.path, baseUrl.value)

  const canonicalQueries = (isObject(seoAttributesOptions) && seoAttributesOptions.canonicalQueries) || []
  const currentRouteQueryParams = currentRoute.query
  const params = new URLSearchParams()
  for (const queryParamName of canonicalQueries) {
    if (queryParamName in currentRouteQueryParams) {
      const queryParamValue = currentRouteQueryParams[queryParamName]

      if (isArray(queryParamValue)) {
        queryParamValue.forEach(v => params.append(queryParamName, v || ''))
      } else {
        params.append(queryParamName, queryParamValue || '')
      }
    }
  }

  const queryString = params.toString()
  if (queryString) {
    href = `${href}?${queryString}`
  }

  head.link.push({ [idAttribute]: 'i18n-can', rel: 'canonical', href })
  head.meta.push({ [idAttribute]: 'i18n-og-url', property: 'og:url', content: href })
}

export function addCurrentOgLocale(
  currentLocale: LocaleObject,
  currentIso: string | undefined,
  head: HeadParam,
  idAttribute: IdParam
) {
  if (!currentLocale || !currentIso) return

  head.meta.push({
    [idAttribute]: 'i18n-og',
    property: 'og:locale',
    // Replace dash with underscore as defined in spec: language_TERRITORY
    content: hypenToUnderscore(currentIso)
  })
}

export function addAlternateOgLocales(
  locales: LocaleObject[],
  currentIso: string | undefined,
  head: HeadParam,
  idAttribute: IdParam
) {
  const alternateLocales = locales.filter(locale => locale.iso && locale.iso !== currentIso)

  for (const locale of alternateLocales) {
    head.meta.push({
      [idAttribute]: `i18n-og-alt-${locale.iso}`,
      property: 'og:locale:alternate',
      content: hypenToUnderscore(locale.iso!)
    })
  }
}

function hypenToUnderscore(str: string) {
  return (str || '').replace(/-/g, '_')
}

function toAbsoluteUrl(urlOrPath: string, baseUrl: string) {
  if (urlOrPath.match(/^https?:\/\//)) return urlOrPath
  return baseUrl + urlOrPath
}

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

/* eslint-disable @typescript-eslint/no-explicit-any */

import { isArray, isString, isFunction, isObject } from '@intlify/shared'
import {
  findBrowserLocale,
  getLocalesRegex,
  isI18nInstance,
  isComposer,
  isExportedGlobalComposer,
  isVueI18n
} from 'vue-i18n-routing'
import JsCookie from 'js-cookie'
import { parse, serialize } from 'cookie-es'
import { hasProtocol } from 'ufo'
import isHTTPS from 'is-https'
import { useRequestHeaders, useRequestEvent } from '#imports'
import {
  nuxtI18nOptionsDefault,
  localeMessages,
  additionalMessages,
  NUXT_I18N_MODULE_ID,
  isSSG
} from '#build/i18n.options.mjs'

import type { NuxtApp } from '#imports'
import type { I18nOptions, Locale, VueI18n, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded, LocaleObject } from 'vue-i18n-routing'
import type { DeepRequired } from 'ts-essentials'
import type { NuxtI18nOptions, NuxtI18nInternalOptions, DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'

export function formatMessage(message: string) {
  return NUXT_I18N_MODULE_ID + ' ' + message
}

function isLegacyVueI18n(target: any): target is VueI18n {
  return target != null && ('__VUE_I18N_BRIDGE__' in target || '_sync' in target)
}

export function callVueI18nInterfaces(i18n: any, name: string, ...args: any[]): any {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  const [obj, method] = [target, (target as any)[name]]
  return Reflect.apply(method, obj, [...args])
}

export function getVueI18nPropertyValue<Return = any>(i18n: any, name: string): Return {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  const ret = isComposer(target)
    ? (target as any)[name].value
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? (target as any)[name]
      : (target as any)[name]
  return ret as Return
}

export function defineGetter<K extends string | number | symbol, V>(obj: Record<K, V>, key: K, val: V) {
  Object.defineProperty(obj, key, { get: () => val })
}

export function proxyNuxt<T extends (...args: any) => any>(nuxt: NuxtApp, target: T) {
  return function () {
    return Reflect.apply(
      target,
      {
        i18n: (nuxt as any).$i18n,
        getRouteBaseName: nuxt.$getRouteBaseName,
        localePath: nuxt.$localePath,
        localeRoute: nuxt.$localeRoute,
        switchLocalePath: nuxt.$switchLocalePath,
        localeHead: nuxt.$localeHead,
        route: (nuxt as any).$router.currentRoute.value,
        router: (nuxt as any).$router
      },
      // eslint-disable-next-line prefer-rest-params
      arguments
    ) as (this: NuxtApp, ...args: Parameters<T>) => ReturnType<T>
  }
}

/**
 * Parses locales provided from browser through `accept-language` header.
 *
 * @param input - Accept-Language header value.
 * @return An array of locale codes. Priority determined by order in array.
 */
export function parseAcceptLanguage(input: string): string[] {
  // Example input: en-US,en;q=0.9,nb;q=0.8,no;q=0.7
  // Contains tags separated by comma.
  // Each tag consists of locale code (2-3 letter language code) and optionally country code
  // after dash. Tag can also contain score after semicolon, that is assumed to match order
  // so it's not explicitly used.
  return input.split(',').map(tag => tag.split(';')[0])
}

function deepCopy(src: Record<string, any>, des: Record<string, any>) {
  for (const key in src) {
    if (isObject(src[key])) {
      if (!isObject(des[key])) des[key] = {}

      deepCopy(src[key], des[key])
    } else {
      des[key] = src[key]
    }
  }
}

async function loadMessage(context: NuxtApp, loader: () => Promise<any>) {
  let message: LocaleMessages<DefineLocaleMessage> | null = null
  try {
    const getter = await loader().then(r => r.default || r)
    // TODO: support for js, cjs, mjs
    if (isFunction(getter)) {
      console.error(formatMessage('Not support executable file (e.g. js, cjs, mjs)'))
    } else {
      message = getter
    }
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error(formatMessage('Failed locale loading: ' + e.message))
  }
  return message
}

const loadedLocales: Locale[] = []
const loadedMessages = new Map<string, LocaleMessages<DefineLocaleMessage>>()

export async function loadLocale(
  context: NuxtApp,
  locale: Locale,
  setter: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void
) {
  if (process.server || process.dev || !loadedLocales.includes(locale)) {
    const loaders = localeMessages[locale]
    if (loaders != null) {
      if (loaders.length === 1) {
        const { key, load } = loaders[0]
        let message: LocaleMessages<DefineLocaleMessage> | undefined | null = null
        if (loadedMessages.has(key)) {
          message = loadedMessages.get(key)
        } else {
          message = await loadMessage(context, load)
          if (message != null) {
            loadedMessages.set(key, message)
          }
        }
        if (message != null) {
          setter(locale, message)
          loadedLocales.push(locale)
        }
      } else if (loaders.length > 1) {
        const targetMessage: LocaleMessages<DefineLocaleMessage> = {}
        for (const { key, load } of loaders) {
          let message: LocaleMessages<DefineLocaleMessage> | undefined | null = null
          if (loadedMessages.has(key)) {
            message = loadedMessages.get(key)
          } else {
            message = await loadMessage(context, load)
            if (message != null) {
              loadedMessages.set(key, message)
            }
          }
          if (message != null) {
            deepCopy(message, targetMessage)
          }
        }
        setter(locale, targetMessage)
        loadedLocales.push(locale)
      }
    }
  } else {
    console.warn(formatMessage('Could not find ' + locale + ' locale code in localeMessages'))
  }
}

const loadedAdditionalLocales: Locale[] = []

export async function loadAdditionalLocale(
  context: NuxtApp,
  locale: Locale,
  merger: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void
) {
  if (process.server || process.dev || !loadedAdditionalLocales.includes(locale)) {
    const additionalLoaders = additionalMessages[locale] || []
    for (const additionalLoader of additionalLoaders) {
      const message = await loadMessage(context, additionalLoader)
      if (message != null) {
        merger(locale, message)
        loadedAdditionalLocales.push(locale)
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getBrowserLocale(options: Required<NuxtI18nInternalOptions>, context?: any): string | undefined {
  let ret: string | undefined

  if (process.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(options.__normalizedLocales, navigator.languages as string[])
      __DEBUG__ && console.log('getBrowserLocale navigator.languages', navigator.languages)
    }
  } else if (process.server) {
    const header = useRequestHeaders(['accept-language'])
    __DEBUG__ && console.log('getBrowserLocale accept-language', header)
    const accept = header['accept-language']
    if (accept) {
      ret = findBrowserLocale(options.__normalizedLocales, parseAcceptLanguage(accept))
    }
  }

  return ret
}

export function getLocaleCookie(
  context: any,
  {
    useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    cookieKey = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieKey,
    localeCodes = []
  }: Pick<DetectBrowserLanguageOptions, 'useCookie' | 'cookieKey'> & {
    localeCodes?: readonly string[]
  } = {}
): string | undefined {
  __DEBUG__ && console.log('getLocaleCookie', { useCookie, cookieKey, localeCodes })
  if (useCookie) {
    let localeCode: string | undefined
    if (process.client) {
      localeCode = JsCookie.get(cookieKey)
    } else if (process.server) {
      const cookie = useRequestHeaders(['cookie'])
      if ('cookie' in cookie) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedCookie = parse((cookie as any)['cookie']) as Record<string, string>
        localeCode = parsedCookie[cookieKey]
        __DEBUG__ && console.log('getLocaleCookie cookie', parsedCookie[cookieKey])
      }
    }

    if (localeCode && localeCodes.includes(localeCode)) {
      return localeCode
    }
  }
}

export function setLocaleCookie(
  locale: string,
  context: any,
  {
    useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    cookieKey = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieKey,
    cookieDomain = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieDomain,
    cookieSecure = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieSecure,
    cookieCrossOrigin = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieCrossOrigin
  }: Pick<
    DetectBrowserLanguageOptions,
    'useCookie' | 'cookieDomain' | 'cookieKey' | 'cookieSecure' | 'cookieCrossOrigin'
  > = {}
) {
  if (!useCookie) {
    return
  }

  const date = new Date()
  const cookieOptions: Record<string, any> = {
    expires: new Date(date.setDate(date.getDate() + 365)),
    path: '/',
    sameSite: cookieCrossOrigin ? 'none' : 'lax',
    secure: cookieCrossOrigin || cookieSecure
  }

  if (cookieDomain) {
    cookieOptions.domain = cookieDomain
  }

  if (process.client) {
    JsCookie.set(cookieKey, locale, cookieOptions)
  } else if (process.server) {
    if (context.res) {
      const { res } = context
      let headers = res.getHeader('Set-Cookie') || []
      if (!isArray(headers)) {
        headers = [String(headers)]
      }

      const redirectCookie = serialize(cookieKey, locale, cookieOptions)
      headers.push(redirectCookie)

      res.setHeader('Set-Cookie', headers)
    }
  }
}

export type DetectBrowserLanguageNotDetectReason =
  | 'unknown'
  | 'not_found_match'
  | 'not_redirect_on_root'
  | 'not_redirect_on_no_prefix'
  | 'detect_ignore_on_ssg'
export type DetectBrowserLanguageFrom = 'unknown' | 'cookie' | 'navigator_or_header' | 'fallback'
export type DetectBrowserLanguageFromResult = {
  locale: string
  stat: boolean
  reason?: DetectBrowserLanguageNotDetectReason
  from?: DetectBrowserLanguageFrom
}
export type DetectLocaleForSSGStatus = 'ssg_ignore' | 'ssg_setup' | 'normal'

export const DefaultDetectBrowserLanguageFromResult: DetectBrowserLanguageFromResult = {
  locale: '',
  stat: false,
  reason: 'unknown',
  from: 'unknown'
}

export function detectBrowserLanguage<Context extends NuxtApp = NuxtApp>(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>,
  nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions>,
  localeCodes: string[] = [],
  locale: Locale = '',
  mode: DetectLocaleForSSGStatus
): DetectBrowserLanguageFromResult {
  const { strategy } = nuxtI18nOptions

  // browser detection is ignored if it's a nuxt generate.
  if (isSSG && strategy === 'no_prefix' && (process.server || mode === 'ssg_ignore')) {
    return { locale: '', stat: true, reason: 'detect_ignore_on_ssg' }
  }

  const { redirectOn, alwaysRedirect, useCookie, fallbackLocale } =
    nuxtI18nOptions.detectBrowserLanguage as DetectBrowserLanguageOptions

  const path = isString(route) ? route : route.path
  __DEBUG__ &&
    console.log(
      'detectBrowserLanguage: (path, strategy, alwaysRedirect, redirectOn, locale) -',
      path,
      strategy,
      alwaysRedirect,
      redirectOn,
      locale
    )
  if (strategy !== 'no_prefix') {
    if (redirectOn === 'root') {
      if (path !== '/') {
        __DEBUG__ && console.log('detectBrowserLanguage: not root')
        return { locale: '', stat: false, reason: 'not_redirect_on_root' }
      }
    } else if (redirectOn === 'no prefix') {
      if (!alwaysRedirect && path.match(getLocalesRegex(localeCodes as string[]))) {
        __DEBUG__ && console.log('detectBrowserLanguage: no prefix')
        return { locale: '', stat: false, reason: 'not_redirect_on_no_prefix' }
      }
    }
  }

  let localeFrom: DetectBrowserLanguageFrom = 'unknown'
  let cookieLocale: string | undefined
  let matchedLocale: string | undefined

  // get preferred language from cookie if present and enabled
  if (useCookie) {
    matchedLocale = cookieLocale = getLocaleCookie(context, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes })
    localeFrom = 'cookie'
    __DEBUG__ && console.log('detectBrowserLanguage: cookieLocale', cookieLocale)
  }
  // try to get locale from either navigator or header detection
  if (!matchedLocale) {
    matchedLocale = getBrowserLocale(nuxtI18nInternalOptions, context)
    localeFrom = 'navigator_or_header'
    __DEBUG__ && console.log('detectBrowserLanguage: browserLocale', matchedLocale)
  }
  __DEBUG__ &&
    console.log(
      'detectBrowserLanguage: (matchedLocale, cookieLocale, localeFrom) -',
      matchedLocale,
      cookieLocale,
      localeFrom
    )

  // set fallback locale if that is not matched locale
  const finalLocale = matchedLocale || fallbackLocale
  if (!matchedLocale && fallbackLocale) {
    localeFrom = 'fallback'
  }
  __DEBUG__ &&
    console.log(
      'detectBrowserLanguage: first finaleLocale (finaleLocale, lcoaleForm) -',
      finalLocale,
      cookieLocale,
      localeFrom
    )

  const vueI18nLocale = locale || (nuxtI18nOptions.vueI18n as I18nOptions).locale
  __DEBUG__ && console.log('detectBrowserLanguage: vueI18nLocale', vueI18nLocale)

  // handle cookie option to prevent multiple redirections
  if (finalLocale && (!useCookie || alwaysRedirect || !cookieLocale)) {
    if (strategy === 'no_prefix') {
      return { locale: finalLocale, stat: true, from: localeFrom }
    } else {
      if (finalLocale !== vueI18nLocale /* && path !== '/'*/) {
        __DEBUG__ && console.log('detectBrowserLanguage: finalLocale !== vueI18nLocale', finalLocale)
        return { locale: finalLocale, stat: true, from: localeFrom }
      } else {
        if (alwaysRedirect && path === '/') {
          return { locale: finalLocale, stat: true, from: localeFrom }
        }
      }
    }
  }

  if (mode === 'ssg_setup' && finalLocale) {
    return { locale: finalLocale, stat: true, from: localeFrom }
  }

  return { locale: '', stat: false, reason: 'not_found_match' }
}

export function getHost() {
  let host: string | undefined
  if (process.client) {
    host = window.location.host
  } else if (process.server) {
    const header = useRequestHeaders(['x-forwarded-host', 'host'])

    let detectedHost: string | undefined
    if ('x-forwarded-host' in header) {
      detectedHost = header['x-forwarded-host']
    } else if ('host' in header) {
      detectedHost = header['host']
    }

    host = isArray(detectedHost) ? detectedHost[0] : detectedHost
  }
  return host
}

export function getLocaleDomain(locales: LocaleObject[]): string {
  let host = getHost() || ''
  if (host) {
    const matchingLocale = locales.find(locale => locale.domain === host)
    if (matchingLocale) {
      return matchingLocale.code
    } else {
      host = ''
    }
  }
  return host
}

export function getDomainFromLocale(localeCode: Locale, locales: LocaleObject[], nuxt?: NuxtApp): string | undefined {
  // lookup the `differentDomain` origin associated with given locale.
  const lang = locales.find(locale => locale.code === localeCode)
  if (lang && lang.domain) {
    if (hasProtocol(lang.domain)) {
      return lang.domain
    }
    let protocol
    if (process.server) {
      const {
        node: { req }
      } = useRequestEvent(nuxt)
      protocol = req && isHTTPS(req) ? 'https' : 'http'
    } else {
      protocol = window.location.protocol.split(':')[0]
    }
    return protocol + '://' + lang.domain
  }

  console.warn(formatMessage('Could not find domain name for locale ' + localeCode))
}

/* eslint-enable @typescript-eslint/no-explicit-any */

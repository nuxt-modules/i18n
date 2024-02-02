/* eslint-disable @typescript-eslint/no-explicit-any */

import { isArray, isString } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import isHTTPS from 'is-https'
import {
  useRequestHeaders,
  useRequestEvent,
  useCookie as useNuxtCookie,
  useRuntimeConfig,
  useNuxtApp,
  unref
} from '#imports'
import {
  nuxtI18nOptionsDefault,
  NUXT_I18N_MODULE_ID,
  isSSG,
  localeCodes,
  nuxtI18nOptions,
  normalizedLocales
} from '#build/i18n.options.mjs'
import { findBrowserLocale, getLocalesRegex, getI18nTarget } from './routing/utils'

import type { Locale } from 'vue-i18n'
import type { DetectBrowserLanguageOptions, LocaleObject } from '#build/i18n.options.mjs'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'

export function formatMessage(message: string) {
  return NUXT_I18N_MODULE_ID + ' ' + message
}

export function callVueI18nInterfaces(i18n: any, name: string, ...args: any[]): any {
  const target = getI18nTarget(i18n)
  // prettier-ignore
  const [obj, method] = [target, (target as any)[name]]
  return Reflect.apply(method, obj, [...args])
}

export function getVueI18nPropertyValue<Return = any>(i18n: any, name: string): Return {
  const target = getI18nTarget(i18n)
  // @ts-expect-error name should be typed instead of string
  return unref(target[name]) as Return
}

export function defineGetter<K extends string | number | symbol, V>(obj: Record<K, V>, key: K, val: V) {
  Object.defineProperty(obj, key, { get: () => val })
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

export function getBrowserLocale(): string | undefined {
  let ret: string | undefined

  if (process.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(normalizedLocales, navigator.languages as string[])
      __DEBUG__ && console.log('getBrowserLocale (navigator.languages, ret) -', navigator.languages, ret)
    }
  } else if (process.server) {
    const header = useRequestHeaders(['accept-language'])
    __DEBUG__ && console.log('getBrowserLocale accept-language', header)
    const accept = header['accept-language']
    if (accept) {
      ret = findBrowserLocale(normalizedLocales, parseAcceptLanguage(accept))
      __DEBUG__ && console.log('getBrowserLocale ret', ret)
    }
  }

  return ret
}

export function getLocaleCookie(): string | undefined {
  const detect = nuxtI18nOptions.detectBrowserLanguage

  __DEBUG__ &&
    console.log('getLocaleCookie', {
      useCookie: detect && detect.useCookie,
      cookieKey: detect && detect.cookieKey,
      localeCodes
    })

  if (!detect || !detect.useCookie) {
    return
  }

  const localeCookie = useNuxtCookie(detect.cookieKey)
  const localeCode: string | undefined = localeCookie.value ?? undefined
  __DEBUG__ && console.log(`getLocaleCookie cookie (${process.client ? 'client' : 'server'}) -`, localeCode)

  if (localeCode && localeCodes.includes(localeCode)) {
    return localeCode
  }
}

export function setLocaleCookie(locale: string) {
  const { useCookie, cookieKey, cookieDomain, cookieSecure, cookieCrossOrigin } =
    nuxtI18nOptions.detectBrowserLanguage || nuxtI18nOptionsDefault.detectBrowserLanguage

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

  const localeCookie = useNuxtCookie(cookieKey, cookieOptions)
  localeCookie.value = locale
}

export type DetectBrowserLanguageNotDetectReason =
  | 'unknown'
  | 'not_found_match'
  | 'first_access_only'
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
export type DetectLocaleCallType = 'setup' | 'routing'
export type DetectLocaleContext = {
  ssg: DetectLocaleForSSGStatus
  callType: DetectLocaleCallType
  firstAccess: boolean
}

export const DefaultDetectBrowserLanguageFromResult: DetectBrowserLanguageFromResult = {
  locale: '',
  stat: false,
  reason: 'unknown',
  from: 'unknown'
}

export function detectBrowserLanguage(
  route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  vueI18nOptionsLocale: Locale | undefined,
  detectLocaleContext: DetectLocaleContext,
  locale: Locale = ''
): DetectBrowserLanguageFromResult {
  const { strategy } = nuxtI18nOptions
  const { ssg, callType, firstAccess } = detectLocaleContext
  __DEBUG__ && console.log('detectBrowserLanguage: (ssg, callType, firstAccess) - ', ssg, callType, firstAccess)

  // browser detection is ignored if it's a nuxt generate.
  if (isSSG && strategy === 'no_prefix' && (process.server || ssg === 'ssg_ignore')) {
    return { locale: '', stat: true, reason: 'detect_ignore_on_ssg' }
  }

  // browser locale detection happens during first access only
  if (!firstAccess) {
    return { locale: strategy === 'no_prefix' ? locale : '', stat: false, reason: 'first_access_only' }
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
      __DEBUG__ && console.log('detectBrowserLanguage: no prefix (path) -', path)
      if (!alwaysRedirect && path.match(getLocalesRegex(localeCodes as string[]))) {
        return { locale: '', stat: false, reason: 'not_redirect_on_no_prefix' }
      }
    }
  }

  let localeFrom: DetectBrowserLanguageFrom = 'unknown'
  let cookieLocale: string | undefined
  let matchedLocale: string | undefined

  // get preferred language from cookie if present and enabled
  if (useCookie) {
    matchedLocale = cookieLocale = getLocaleCookie()
    localeFrom = 'cookie'
    __DEBUG__ && console.log('detectBrowserLanguage: cookieLocale', cookieLocale)
  }
  // try to get locale from either navigator or header detection
  if (!matchedLocale) {
    matchedLocale = getBrowserLocale()
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
      'detectBrowserLanguage: first finaleLocale (finaleLocale, cookieLocale, localeFrom) -',
      finalLocale,
      cookieLocale,
      localeFrom
    )

  const vueI18nLocale = locale || vueI18nOptionsLocale
  __DEBUG__ && console.log('detectBrowserLanguage: vueI18nLocale', vueI18nLocale)

  // handle cookie option to prevent multiple redirects
  if (finalLocale && (!useCookie || alwaysRedirect || !cookieLocale)) {
    if (strategy === 'no_prefix') {
      return { locale: finalLocale, stat: true, from: localeFrom }
    } else {
      if (callType === 'setup') {
        if (finalLocale !== vueI18nLocale) {
          __DEBUG__ && console.log('detectBrowserLanguage: finalLocale !== vueI18nLocale', finalLocale)
          return { locale: finalLocale, stat: true, from: localeFrom }
        }
      }

      if (alwaysRedirect) {
        const redirectOnRoot = path === '/'
        const redirectOnAll = redirectOn === 'all'
        const redirectOnNoPrefix = redirectOn === 'no prefix' && !path.match(getLocalesRegex(localeCodes as string[]))
        __DEBUG__ &&
          console.log(
            'detectBrowserLanguage: (redirectOnRoot, redirectOnAll, redirectOnNoPrefix) - ',
            redirectOnRoot,
            redirectOnAll,
            redirectOnNoPrefix
          )
        if (redirectOnRoot || redirectOnAll || redirectOnNoPrefix) {
          return { locale: finalLocale, stat: true, from: localeFrom }
        }
      }
    }
  }

  if (ssg === 'ssg_setup' && finalLocale) {
    return { locale: finalLocale, stat: true, from: localeFrom }
  }

  if ((localeFrom === 'navigator_or_header' || localeFrom === 'cookie') && finalLocale) {
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
    const matchingLocale = locales.find(locale => {
      if (locale && locale.domain) {
        let domain = locale.domain
        if (hasProtocol(locale.domain)) {
          domain = locale.domain.replace(/(http|https):\/\//, '')
        }
        return domain === host
      }
      return false
    })
    if (matchingLocale) {
      return matchingLocale.code
    } else {
      host = ''
    }
  }
  return host
}

export function getDomainFromLocale(localeCode: Locale): string | undefined {
  const runtimeConfig = useRuntimeConfig()
  const nuxtApp = useNuxtApp()
  // lookup the `differentDomain` origin associated with given locale.
  const config = runtimeConfig.public.i18n as { locales?: Record<Locale, { domain?: string }> }
  const lang = normalizedLocales.find(locale => locale.code === localeCode)
  const domain = config?.locales?.[localeCode]?.domain ?? lang?.domain

  if (domain) {
    if (hasProtocol(domain, { strict: true })) {
      return domain
    }
    let protocol
    if (process.server) {
      const {
        node: { req }
      } = useRequestEvent(nuxtApp)!
      protocol = req && isHTTPS(req) ? 'https:' : 'http:'
    } else {
      protocol = new URL(window.location.origin).protocol
    }
    return protocol + '//' + domain
  }

  console.warn(formatMessage('Could not find domain name for locale ' + localeCode))
}

/* eslint-enable @typescript-eslint/no-explicit-any */

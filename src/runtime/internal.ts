/* eslint-disable @typescript-eslint/no-explicit-any */

import { isVue3, isVue2 } from 'vue-demi'
import { isArray, isString, isFunction } from '@intlify/shared'
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
import { nuxtI18nOptionsDefault, localeMessages, additionalMessages } from '#build/i18n.options.mjs'

import type { NuxtApp } from '#imports'
import type { I18nOptions, Locale, VueI18n, LocaleMessages, DefineLocaleMessage } from '@intlify/vue-i18n-bridge'
import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded, LocaleObject } from 'vue-i18n-routing'
import type { DeepRequired } from 'ts-essentials'
import type { NuxtI18nOptions, NuxtI18nInternalOptions, DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'

export function formatMessage(message: string) {
  // TODO: should be shared via constants
  return '[@nuxtjs/i18n] ' + message
}

function isLegacyVueI18n(target: any): target is VueI18n {
  return target != null && ('__VUE_I18N_BRIDGE__' in target || '_sync' in target)
}

export function callVueI18nInterfaces(i18n: any, name: string, ...args: any[]): any {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  const [obj, method] = isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? [i18n, (i18n as any)[name]]
      : [target, (target as any)[name]]
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? [target, (target as any)[name]]
      : [target, (target as any)[name]]
  return Reflect.apply(method, obj, [...args])
}

export function getVueI18nPropertyValue<Return = any>(i18n: any, name: string): Return {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  const ret = isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? (i18n as any)[name]
      : (target as any)[name].value
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
        i18n: nuxt.$i18n,
        getRouteBaseName: nuxt.$getRouteBaseName,
        localePath: nuxt.$localePath,
        localeRoute: nuxt.$localeRoute,
        switchLocalePath: nuxt.$switchLocalePath,
        localeHead: nuxt.$localeHead,
        route: (nuxt as any).$router.currentRoute.value,
        router: (nuxt as any).$router,
        store: undefined
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

export async function loadLocale(
  context: NuxtApp,
  locale: Locale,
  setter: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void
) {
  if (process.server || process.dev || !loadedLocales.includes(locale)) {
    const loader = localeMessages[locale]
    if (loader != null) {
      const message = await loadMessage(context, loader)
      if (message != null) {
        setter(locale, message)
        loadedLocales.push(locale)
      }
    } else {
      console.warn(formatMessage('Could not find ' + locale + ' locale in localeMessages'))
    }
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

export function getBrowserLocale(options: Required<NuxtI18nInternalOptions>, context?: any): string | undefined {
  let ret: string | undefined

  if (process.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(options.__normalizedLocales, navigator.languages as string[])
      __DEBUG__ && console.log('getBrowserLocale navigator.languages', navigator.languages)
    }
  } else if (process.server) {
    if (!isVue3) {
      if (context.req && typeof context.req.headers['accept-language'] !== 'undefined') {
        ret = findBrowserLocale(
          options.__normalizedLocales,
          parseAcceptLanguage(context.req.headers['accept-language'])
        )
      }
    } else {
      const header = useRequestHeaders(['accept-language'])
      __DEBUG__ && console.log('getBrowserLocale accept-language', header)
      const accept = header['accept-language']
      if (accept) {
        ret = findBrowserLocale(options.__normalizedLocales, parseAcceptLanguage(accept))
      }
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

export function detectBrowserLanguage<Context extends NuxtApp = NuxtApp>(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>,
  nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions>,
  localeCodes: string[] = [],
  locale: Locale = ''
): string {
  __DEBUG__ && console.log('detectBrowserLanguage: locale params', locale)
  const { strategy } = nuxtI18nOptions
  const { redirectOn, alwaysRedirect, useCookie, fallbackLocale } =
    nuxtI18nOptions.detectBrowserLanguage as DetectBrowserLanguageOptions

  const path = isString(route) ? route : route.path
  __DEBUG__ && console.log('detectBrowserLanguage check route, strategy and redirectOn', path, strategy, redirectOn)
  if (strategy !== 'no_prefix') {
    if (redirectOn === 'root') {
      if (path !== '/') {
        __DEBUG__ && console.log('detectBrowserLanguage: not root')
        return ''
      }
    } else if (redirectOn === 'no prefix') {
      if (!alwaysRedirect && path.match(getLocalesRegex(localeCodes as string[]))) {
        __DEBUG__ && console.log('detectBrowserLanguage: no prefix')
        return ''
      }
    }
  }

  // get preferred language from cookie if present and enabled
  const cookieLocale = getLocaleCookie(context, { ...nuxtI18nOptions.detectBrowserLanguage, localeCodes })
  __DEBUG__ && console.log('detectBrowserLanguage cookieLocale', cookieLocale)
  __DEBUG__ && console.log('detectBrowserLanguage browserLocale', getBrowserLocale(nuxtI18nInternalOptions, context))

  let matchedLocale = cookieLocale
  // try to get locale from either navigator or header detection
  if (!useCookie) {
    matchedLocale = getBrowserLocale(nuxtI18nInternalOptions, context)
  }
  __DEBUG__ && console.log('detectBrowserLanguage matchedLocale', matchedLocale)

  const finalLocale = matchedLocale || fallbackLocale
  const vueI18nLocale = locale || (nuxtI18nOptions.vueI18n as I18nOptions).locale
  __DEBUG__ && console.log('detectBrowserLanguage first finaleLocale', finalLocale)
  __DEBUG__ && console.log('detectBrowserLanguage vueI18nLocale', vueI18nLocale)

  // handle cookie option to prevent multiple redirections
  if (finalLocale && (!useCookie || alwaysRedirect || !cookieLocale)) {
    if (strategy === 'no_prefix') {
      return finalLocale
    } else {
      if (finalLocale !== vueI18nLocale && path !== '/') {
        __DEBUG__ && console.log('detectBrowserLanguage finalLocale !== vueI18nLocale', finalLocale)
        return finalLocale
      }
    }
  }

  return ''
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
  const host = getHost() || ''
  if (host) {
    const matchingLocale = locales.find(locale => locale.domain === host)
    if (matchingLocale) {
      return matchingLocale.code
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
      const { req } = useRequestEvent(nuxt)
      protocol = req && isHTTPS(req) ? 'https' : 'http'
    } else {
      protocol = window.location.protocol.split(':')[0]
    }
    return protocol + '://' + lang.domain
  }

  console.warn(formatMessage('Could not find domain name for locale ' + localeCode))
}

/* eslint-enable @typescript-eslint/no-explicit-any */

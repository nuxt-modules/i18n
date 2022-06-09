/* eslint-disable @typescript-eslint/no-explicit-any */

import { isVue3, isVue2 } from 'vue-demi'
import { isArray, isString, isFunction } from '@intlify/shared'
import {
  findBrowserLocale,
  createLocaleFromRouteGetter,
  getLocalesRegex,
  isI18nInstance,
  isComposer,
  isExportedGlobalComposer,
  isVueI18n
} from 'vue-i18n-routing'
import JsCookie from 'js-cookie'
import { parse, serialize } from 'cookie-es'
import { nuxtI18nOptionsDefault, nuxtI18nInternalOptions, localeMessages } from '#build/i18n.options.mjs'
import { CLIENT, SERVER, STATIC, DEV } from '#build/i18n.frags.mjs'

import type { I18nOptions, Locale, VueI18n, LocaleMessages, DefineLocaleMessage } from '@intlify/vue-i18n-bridge'
import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-i18n-routing'
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

async function loadMessage(context: any, locale: Locale) {
  let message: LocaleMessages<DefineLocaleMessage> | null = null
  const loader = localeMessages[locale]
  if (loader) {
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
  } else {
    console.warn(formatMessage('Could not find ' + locale + ' locale'))
  }
  return message
}

const loadedLocales: Locale[] = []

export async function loadLocale(
  context: any,
  locale: Locale,
  setter: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void
) {
  if (SERVER || DEV || !loadedLocales.includes(locale)) {
    const message = await loadMessage(context, locale)
    if (message != null) {
      setter(locale, message)
      loadedLocales.push(locale)
    }
  }
}

export function getBrowserLocale(options: Required<NuxtI18nInternalOptions>, context?: any): string | undefined {
  let ret: string | undefined

  if (CLIENT) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(options.__normalizedLocales, navigator.languages as string[])
    }
  } else if (SERVER) {
    if (!isVue3) {
      if (context.req && typeof context.req.headers['accept-language'] !== 'undefined') {
        ret = findBrowserLocale(
          options.__normalizedLocales,
          parseAcceptLanguage(context.req.headers['accept-language'])
        )
      }
    } else {
      // TODO: should implement compability for options API style
      throw new Error('Not implement for nuxt3 options API style')
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
  if (useCookie) {
    let localeCode: string | undefined

    if (CLIENT) {
      localeCode = JsCookie.get(cookieKey)
    } else if (SERVER) {
      if (context.req && typeof context.req.headers.cookie !== 'undefined') {
        const cookies: Record<string, any> =
          context.req.headers && context.req.headers.cookie ? parse(context.req.headers.cookie) : {}
        localeCode = cookies[cookieKey]
      } else {
        throw new Error('server request unexpected error')
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

  if (CLIENT) {
    JsCookie.set(cookieKey, locale, cookieOptions)
  } else if (SERVER) {
    if (!isVue3 && context.res) {
      const { res } = context
      let headers = res.getHeader('Set-Cookie') || []
      if (!isArray(headers)) {
        headers = [String(headers)]
      }

      const redirectCookie = serialize(cookieKey, locale, cookieOptions)
      headers.push(redirectCookie)

      res.setHeader('Set-Cookie', headers)
    } else {
      // TODO: should implement compability for options API style
      throw new Error('Not implement for nuxt3 options API style')
    }
  }
}

export function getInitialLocale(
  context: any,
  route: string | Route | RouteLocationNormalized,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>,
  localeCodes: string[],
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  locale = ''
): string {
  const { strategy, defaultLocale, vueI18n } = nuxtI18nOptions
  const initialLocale = locale || (vueI18n as I18nOptions).locale || 'en-US'
  const browserLocale = nuxtI18nOptions.detectBrowserLanguage
    ? detectBrowserLanguage(route, context, nuxtI18nOptions, nuxtI18nInternalOptions, localeCodes, initialLocale)
    : ''
  // TODO: remove console log!
  console.log('getInitialLocale strategy:', strategy)
  console.log('getInitialLocale browserLocale:', browserLocale)
  console.log('getInitialLocale initialLocale:', initialLocale)

  let finalLocale: string | undefined = browserLocale
  if (!finalLocale) {
    if (strategy !== 'no_prefix') {
      finalLocale = routeLocaleGetter(route)
      // TODO: remove console log!
      console.log('getInitialLocale routeLocale:', finalLocale)
    }
  }

  if (!finalLocale && nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie) {
    finalLocale = getLocaleCookie(context, { ...nuxtI18nOptions, localeCodes })
    // TODO: remove console log!
    console.log('getInitialLocale cookieLocale:', finalLocale)
  }

  if (!finalLocale) {
    finalLocale = defaultLocale || ''
  }

  return finalLocale
}

export function detectBrowserLanguage(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>,
  nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions>,
  localeCodes: string[] = [],
  locale: Locale = ''
): string {
  // browser detection is ignored if it is a nuxt generate.
  if (STATIC) {
    return ''
  }

  const { strategy } = nuxtI18nOptions
  const { redirectOn, alwaysRedirect, useCookie, fallbackLocale } =
    nuxtI18nOptions.detectBrowserLanguage as DetectBrowserLanguageOptions
  // TODO: remove console log!
  console.log(
    'detectBrowserLanguage',
    route,
    localeCodes,
    locale,
    strategy,
    redirectOn,
    alwaysRedirect,
    useCookie,
    fallbackLocale
  )

  const path = isString(route) ? route : route.path
  if (strategy !== 'no_prefix') {
    if (redirectOn === 'root') {
      if (path !== '/') {
        return ''
      }
    } else if (redirectOn === 'no prefix') {
      if (!alwaysRedirect && path.match(getLocalesRegex(localeCodes as string[]))) {
        return ''
      }
    }
  }

  // get preferred language from cookie if present and enabled
  const cookieLocale = getLocaleCookie(context, { ...nuxtI18nOptions, localeCodes })
  // TODO: remove console log!
  console.log('detectBrowserLanguage: cookieLocale', cookieLocale)
  let matchedLocale = cookieLocale
  // try to get locale from either navigator or header detection
  if (!useCookie) {
    matchedLocale = getBrowserLocale(nuxtI18nInternalOptions, context)
    // TODO: remove console log!
    console.log('detectBrowserLanguage: getBrowserLocale', matchedLocale)
  }

  const finalLocale = matchedLocale || fallbackLocale
  const vueI18nLocale = locale || (nuxtI18nOptions.vueI18n as I18nOptions).locale

  // handle cookie option to prevent multiple redirections
  if (finalLocale && (!useCookie || alwaysRedirect || !cookieLocale)) {
    if (finalLocale !== vueI18nLocale) {
      return finalLocale
    }
  }

  return ''
}

/* eslint-enable @typescript-eslint/no-explicit-any */

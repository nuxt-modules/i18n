import { isVue3 } from 'vue-demi'
import { isArray, isString } from '@intlify/shared'
import { findBrowserLocale, createLocaleFromRouteGetter, getLocalesRegex } from 'vue-i18n-routing'
import JsCookie from 'js-cookie'
import { parse, serialize } from 'cookie-es'
import { nuxtI18nOptionsDefault, nuxtI18nInternalOptions } from '#build/i18n.options.mjs'

import type { I18nOptions, Locale } from '@intlify/vue-i18n-bridge'
import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-i18n-routing'
import type { DeepRequired } from 'ts-essentials'
import type { NuxtI18nOptions, NuxtI18nInternalOptions, DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBrowserLocale(options: Required<NuxtI18nInternalOptions>, context?: any): string | undefined {
  let ret: string | undefined

  if (process.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(options.__normalizedLocales, navigator.languages as string[])
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
      // TODO: should implement compability for options API style
      throw new Error('Not implement for nuxt3 options API style')
    }
  }

  return ret
}

export function getLocaleCookie(
  context: any, // eslint-disable-line @typescript-eslint/no-explicit-any
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

    if (process.client) {
      localeCode = JsCookie.get(cookieKey)
    } else if (process.server) {
      if (context.req && typeof context.req.headers.cookie !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  context: any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  context: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  route: string | Route | RouteLocationNormalized,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>,
  localeCodes: string[],
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  locale = ''
): string {
  const {
    strategy,
    defaultLocale,
    vueI18n,
    detectBrowserLanguage: { useCookie }
  } = nuxtI18nOptions
  const initialLocale = locale || (vueI18n as I18nOptions).locale || 'en-US'
  const routeLocale = strategy !== 'no_prefix' ? routeLocaleGetter(route) : ''
  const browserLocale = nuxtI18nOptions.detectBrowserLanguage
    ? detectBrowserLanguage(route, context, nuxtI18nOptions, nuxtI18nInternalOptions, localeCodes, initialLocale)
    : ''
  // TODO: remove console log!
  console.log('getInitialLocale strategy:', strategy)
  console.log('getInitialLocale routeLocale:', routeLocale)
  console.log('getInitialLocale browserLocale:', browserLocale)
  console.log('getInitialLocale initialLocale:', initialLocale)

  // TODO: should be refacotred with ternary operator
  if (strategy === 'no_prefix') {
    return browserLocale
  } else if (strategy === 'prefix_except_default') {
    return routeLocale || defaultLocale
  } else if (strategy === 'prefix_and_default') {
    return useCookie ? browserLocale : routeLocale || defaultLocale
  } else {
    // 'prefix'
    return routeLocale
  }
}

export function detectBrowserLanguage(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>,
  nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions>,
  localeCodes: string[] = [],
  locale: Locale = ''
): string {
  const {
    strategy,
    detectBrowserLanguage: { redirectOn, alwaysRedirect, useCookie, fallbackLocale }
  } = nuxtI18nOptions
  // TODO: remove console log!
  console.log('detectBrowserLanguage', route, localeCodes, locale, strategy, redirectOn, alwaysRedirect, useCookie)

  // browser detection is ignored if it is a nuxt generate.
  if (process.static) {
    return ''
  }

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

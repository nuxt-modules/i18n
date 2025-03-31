import { isString } from '@intlify/shared'
import { useCookie, useNuxtApp, useRequestHeader, useRuntimeConfig } from '#imports'
import { DEFAULT_COOKIE_KEY, isSSG, localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { findBrowserLocale, regexpPath } from './routing/utils'
import { initCommonComposableOptions } from './utils'
import { createLogger } from '#nuxt-i18n/logger'

import type { Locale } from 'vue-i18n'
import type { DetectBrowserLanguageOptions, I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CookieOptions, CookieRef } from 'nuxt/app'
import type { CompatRoute } from './types'
import type { CommonComposableOptions } from './utils'

type TailParameters<T> = T extends (first: CommonComposableOptions, ...rest: infer R) => unknown ? R : never

export function wrapComposable<F extends (common: CommonComposableOptions, ...args: never[]) => ReturnType<F>>(
  fn: F,
  common = initCommonComposableOptions()
) {
  return (...args: TailParameters<F>) => fn(common, ...args)
}

/**
 * Parses locales provided from browser through `accept-language` header.
 *
 * @param input - Accept-Language header value.
 * @return An array of locale codes. Priority determined by order in array.
 */
function parseAcceptLanguage(input: string = ''): string[] {
  // Example input: en-US,en;q=0.9,nb;q=0.8,no;q=0.7
  // Contains tags separated by comma.
  // Each tag consists of locale code (2-3 letter language code) and optionally country code
  // after dash. Tag can also contain score after semicolon, that is assumed to match order
  // so it's not explicitly used.
  return input.split(',').map(tag => tag.split(';')[0])
}

export function getBrowserLocale(): string | undefined {
  // get browser language either from navigator if running on client side, or from the headers
  const browserLocales = import.meta.client
    ? navigator.languages
    : parseAcceptLanguage(useRequestHeader('accept-language'))
  return findBrowserLocale(normalizedLocales, browserLocales) || undefined
}

export function createI18nCookie() {
  const detect = runtimeDetectBrowserLanguage()
  const cookieKey = (detect && detect.cookieKey) || DEFAULT_COOKIE_KEY
  const date = new Date()
  const cookieOptions: CookieOptions<string | null | undefined> & { readonly: false } = {
    path: '/',
    readonly: false,
    expires: new Date(date.setDate(date.getDate() + 365)),
    sameSite: detect && detect.cookieCrossOrigin ? 'none' : 'lax',
    domain: (detect && detect.cookieDomain) || undefined,
    secure: (detect && detect.cookieCrossOrigin) || (detect && detect.cookieSecure)
  }
  return useCookie(cookieKey, cookieOptions)
}

// TODO: remove side-effects
export function getLocaleCookie(
  cookieRef: CookieRef<string | null | undefined>,
  detect: false | DetectBrowserLanguageOptions,
  defaultLocale: string
): string | undefined {
  const logger = /*#__PURE__*/ createLogger(`getLocaleCookie:${import.meta.client ? 'client' : 'server'}`)
  __DEBUG__ &&
    logger.log({
      useCookie: detect && detect.useCookie,
      cookieKey: detect && detect.cookieKey,
      localeCodes
    })

  if (detect === false || !detect.useCookie) {
    return
  }

  const localeCode: string | undefined = cookieRef.value ?? undefined
  if (localeCode == null) {
    __DEBUG__ && logger.log(`none`)
    return
  }

  if (localeCodes.includes(localeCode)) {
    __DEBUG__ && logger.log(`locale from cookie: `, localeCode)
    return localeCode
  }

  if (defaultLocale) {
    __DEBUG__ && logger.log(`unknown locale cookie (${localeCode}), setting to defaultLocale (${defaultLocale})`)
    cookieRef.value = defaultLocale
    return defaultLocale
  }

  __DEBUG__ && logger.log(`unknown locale cookie (${localeCode}), unsetting cookie`)
  cookieRef.value = undefined
}

type DetectBrowserLanguageResult = {
  locale: string
  from?: 'cookie' | 'navigator_or_header' | 'fallback'
  error?:
    | 'not_found_match'
    | 'first_access_only'
    | 'not_redirect_on_root'
    | 'not_redirect_on_no_prefix'
    | 'detect_ignore_on_ssg'
    | 'disabled'
}

export function detectBrowserLanguage(
  route: string | CompatRoute,
  localeCookie: string | undefined,
  locale: Locale = ''
): DetectBrowserLanguageResult {
  const logger = /*#__PURE__*/ createLogger('detectBrowserLanguage')
  const _detect = runtimeDetectBrowserLanguage()

  // feature is disabled
  if (!_detect) {
    return { locale: '', error: 'disabled' }
  }

  const nuxtApp = useNuxtApp()
  const strategy = nuxtApp.$i18n.strategy
  const firstAccess = nuxtApp._vueI18n.__firstAccess

  __DEBUG__ && logger.log({ firstAccess })

  // detection ignored during nuxt generate
  if (isSSG && firstAccess && strategy === 'no_prefix' && import.meta.server) {
    return { locale: '', error: 'detect_ignore_on_ssg' }
  }

  // detection only on first access
  if (!firstAccess) {
    return { locale: strategy === 'no_prefix' ? locale : '', error: 'first_access_only' }
  }

  __DEBUG__ && logger.log({ locale, path: isString(route) ? route : route.path, strategy, ..._detect })

  if (strategy !== 'no_prefix') {
    const path = isString(route) ? route : route.path

    // detection only on root
    if (_detect.redirectOn === 'root' && path !== '/') {
      return { locale: '', error: 'not_redirect_on_root' }
    }

    // detection only on unprefixed route
    if (_detect.redirectOn === 'no prefix' && !_detect.alwaysRedirect && path.match(regexpPath)) {
      return { locale: '', error: 'not_redirect_on_no_prefix' }
    }
  }

  // match locale from cookie if enabled and present
  const cookieMatch = (_detect.useCookie && localeCookie) || undefined
  if (cookieMatch) {
    return { locale: cookieMatch, from: 'cookie' }
  }

  // match locale from either navigator or header detection
  const browserMatch = nuxtApp.$i18n.getBrowserLocale()
  if (browserMatch) {
    return { locale: browserMatch, from: 'navigator_or_header' }
  }

  // use fallback locale when no locale matched
  return { locale: _detect.fallbackLocale || '', from: 'fallback' }
}

export function runtimeDetectBrowserLanguage(
  opts: I18nPublicRuntimeConfig = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
) {
  if (opts?.detectBrowserLanguage === false) return false
  return opts?.detectBrowserLanguage
}

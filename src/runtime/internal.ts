/* eslint-disable @typescript-eslint/no-explicit-any */

import { isArray, isString, isObject } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import isHTTPS from 'is-https'
import { useRequestHeaders, useRequestEvent, useCookie as useNuxtCookie, useRuntimeConfig, useNuxtApp } from '#imports'
import { NUXT_I18N_MODULE_ID, DEFAULT_COOKIE_KEY, isSSG, localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { findBrowserLocale, getLocalesRegex } from './routing/utils'
import { createLogger, initCommonComposableOptions, type CommonComposableOptions } from './utils'

import type { Locale } from 'vue-i18n'
import type { DetectBrowserLanguageOptions, LocaleObject } from '#build/i18n.options.mjs'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import type { CookieRef } from 'nuxt/app'
import type { ModulePublicRuntimeConfig } from '../module'

export function formatMessage(message: string) {
  return NUXT_I18N_MODULE_ID + ' ' + message
}

export function defineGetter<K extends string | number | symbol, V>(obj: Record<K, V>, key: K, val: V) {
  Object.defineProperty(obj, key, { get: () => val })
}

type TailParameters<T> = T extends (first: CommonComposableOptions, ...rest: infer R) => unknown ? R : never

export function wrapComposable<F extends (common: CommonComposableOptions, ...args: any[]) => any>(
  fn: F,
  common = initCommonComposableOptions()
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- FIXME
  return (...args: TailParameters<F>) => fn(common, ...args)
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

  if (import.meta.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(normalizedLocales, navigator.languages as string[])
      __DEBUG__ && console.log('getBrowserLocale (navigator.languages, ret) -', navigator.languages, ret)
    }
  } else if (import.meta.server) {
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

export function getI18nCookie() {
  const detect = runtimeDetectBrowserLanguage()
  const cookieKey = (detect && detect.cookieKey) || DEFAULT_COOKIE_KEY
  const date = new Date()
  const cookieOptions: Record<string, any> = {
    expires: new Date(date.setDate(date.getDate() + 365)),
    path: '/',
    sameSite: detect && detect.cookieCrossOrigin ? 'none' : 'lax',
    secure: (detect && detect.cookieCrossOrigin) || (detect && detect.cookieSecure)
  }

  if (detect && detect.cookieDomain) {
    cookieOptions.domain = detect.cookieDomain
  }

  return useNuxtCookie<string | undefined>(cookieKey, cookieOptions)
}

export function getLocaleCookie(
  cookieRef: CookieRef<string | undefined>,
  detect: false | DetectBrowserLanguageOptions,
  defaultLocale: string
): string | undefined {
  __DEBUG__ &&
    console.log('getLocaleCookie', {
      useCookie: detect && detect.useCookie,
      cookieKey: detect && detect.cookieKey,
      localeCodes
    })

  if (detect === false || !detect.useCookie) {
    return
  }

  const localeCode: string | undefined = cookieRef.value ?? undefined
  const env = import.meta.client ? 'client' : 'server'
  if (localeCode == null) {
    __DEBUG__ && console.log(`getLocaleCookie (${env}) - none`)
    return
  }

  if (localeCodes.includes(localeCode)) {
    __DEBUG__ && console.log(`getLocaleCookie (${env}) - locale from cookie: `, localeCode)
    return localeCode
  }

  if (defaultLocale) {
    __DEBUG__ &&
      console.log(
        `getLocaleCookie (${env}) - unknown locale cookie (${localeCode}), setting to defaultLocale (${defaultLocale})`
      )
    cookieRef.value = defaultLocale
    return defaultLocale
  }

  __DEBUG__ && console.log(`getLocaleCookie (${env}) - unknown locale cookie (${localeCode}), unsetting cookie`)
  cookieRef.value = undefined
  return
}

export function setLocaleCookie(
  cookieRef: CookieRef<string | undefined>,
  locale: string,
  detect: false | DetectBrowserLanguageOptions
) {
  if (detect === false || !detect.useCookie) {
    return
  }

  cookieRef.value = locale
}

export const enum DetectFailure {
  NOT_FOUND = 'not_found_match',
  FIRST_ACCESS = 'first_access_only',
  NO_REDIRECT_ROOT = 'not_redirect_on_root',
  NO_REDIRECT_NO_PREFIX = 'not_redirect_on_no_prefix',
  SSG_IGNORE = 'detect_ignore_on_ssg'
}

const enum DetectFrom {
  COOKIE = 'cookie',
  NAVIGATOR_HEADER = 'navigator_or_header',
  FALLBACK = 'fallback'
}

type DetectBrowserLanguageFromResult = {
  locale: string
  from?: DetectFrom
  reason?: DetectFailure
}
export type DetectLocaleForSSGStatus = 'ssg_ignore' | 'ssg_setup' | 'normal'
export type DetectLocaleCallType = 'setup' | 'routing'
export type DetectLocaleContext = {
  ssg: DetectLocaleForSSGStatus
  callType: DetectLocaleCallType
  firstAccess: boolean
  localeCookie: string | undefined
}

export const DefaultDetectBrowserLanguageFromResult: DetectBrowserLanguageFromResult = { locale: '' }

export function detectBrowserLanguage(
  route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  detectLocaleContext: DetectLocaleContext,
  locale: Locale = ''
): DetectBrowserLanguageFromResult {
  const logger = createLogger('detectBrowserLanguage')
  const _detect = runtimeDetectBrowserLanguage()

  // feature is disabled
  if (!_detect) {
    return DefaultDetectBrowserLanguageFromResult
  }

  const { strategy } = useRuntimeConfig().public.i18n
  const { ssg, callType, firstAccess, localeCookie } = detectLocaleContext

  __DEBUG__ && logger.log({ ssg, callType, firstAccess })

  // detection ignored during nuxt generate
  if (isSSG && strategy === 'no_prefix' && (import.meta.server || ssg === 'ssg_ignore')) {
    return { locale: '', reason: DetectFailure.SSG_IGNORE }
  }

  // detection only on first access
  if (!firstAccess) {
    return { locale: strategy === 'no_prefix' ? locale : '', reason: DetectFailure.FIRST_ACCESS }
  }

  const { redirectOn, alwaysRedirect, useCookie, fallbackLocale } = _detect

  const path = isString(route) ? route : route.path
  __DEBUG__ && logger.log({ locale, path, strategy, alwaysRedirect, redirectOn })

  if (strategy !== 'no_prefix') {
    // detection only on root
    if (redirectOn === 'root' && path !== '/') {
      __DEBUG__ && logger.log('not root', { path })
      return { locale: '', reason: DetectFailure.NO_REDIRECT_ROOT }
    }

    __DEBUG__ && redirectOn === 'no prefix' && logger.log('no prefix -', { path })

    // detection only on unprefixed route
    if (redirectOn === 'no prefix' && !alwaysRedirect && path.match(getLocalesRegex(localeCodes))) {
      return { locale: '', reason: DetectFailure.NO_REDIRECT_NO_PREFIX }
    }
  }

  // track detection match source
  let from: DetectFrom | undefined

  // match locale from cookie if enabled and present
  const cookieMatch = (useCookie && localeCookie) || undefined
  if (useCookie) {
    from = DetectFrom.COOKIE
  }

  // match locale from either navigator or header detection
  const browserMatch = getBrowserLocale()
  if (!cookieMatch) {
    from = DetectFrom.NAVIGATOR_HEADER
  }

  const matchedLocale = cookieMatch || browserMatch

  // use fallback locale when no locale matched
  const resolved = matchedLocale || fallbackLocale || ''
  if (!matchedLocale && fallbackLocale) {
    from = DetectFrom.FALLBACK
  }

  __DEBUG__ && logger.log({ locale: resolved, cookieMatch, browserMatch, from })

  return { locale: resolved, from }
}

export function getHost() {
  let host: string | undefined
  if (import.meta.client) {
    host = window.location.host
  } else if (import.meta.server) {
    const header = useRequestHeaders(['x-forwarded-host', 'host'])

    let detectedHost: string | string[] | undefined
    if ('x-forwarded-host' in header) {
      detectedHost = header['x-forwarded-host']
    } else if ('host' in header) {
      detectedHost = header['host']
    }

    host = isArray(detectedHost) ? detectedHost[0] : detectedHost
  }
  return host
}

export function getLocaleDomain(
  locales: LocaleObject[],
  strategy: string,
  route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded
): string {
  let host = getHost() || ''
  if (host) {
    __DEBUG__ &&
      console.log(
        `MultiDomainsMultiLocales: locating domain for host: `,
        host,
        strategy,
        isObject(route) ? route.path : route
      )
    let matchingLocale: LocaleObject | undefined
    const matchingLocales = locales.filter(locale => {
      if (locale && locale.domain) {
        let domain = locale.domain
        if (hasProtocol(locale.domain)) {
          domain = locale.domain.replace(/(http|https):\/\//, '')
        }
        return domain === host
      }
      return false
    })

    if (matchingLocales.length === 1) {
      matchingLocale = matchingLocales[0]
      __DEBUG__ &&
        console.log(`MultiDomainsMultiLocales: found only one matching domain: `, host, matchingLocales[0].code)
    } else if (matchingLocales.length > 1) {
      if (strategy === 'no_prefix') {
        console.warn(
          formatMessage(
            'Multiple matching domains found! This is not supported for no_prefix strategy in combination with differentDomains!'
          )
        )
        // Just return the first matching domain locale
        matchingLocale = matchingLocales[0]
      } else {
        // get prefix from route
        if (route) {
          const routePath = isObject(route) ? route.path : isString(route) ? route : ''

          __DEBUG__ &&
            console.log(`MultiDomainsMultiLocales: Check in matched domain for locale match in path: `, routePath, host)

          if (routePath && routePath !== '') {
            const matches = routePath.match(getLocalesRegex(matchingLocales.map(l => l.code)))
            if (matches && matches.length > 1) {
              matchingLocale = matchingLocales.find(l => l.code === matches[1])
              __DEBUG__ &&
                console.log(
                  `MultiDomainsMultiLocales: Found matching locale from path. MatchingLocale is now`,
                  matchingLocale?.code
                )
            }
          }
        }

        if (!matchingLocale) {
          // Fall back to default language on this domain - if set
          matchingLocale = matchingLocales.find(l => l.domainDefault)
          __DEBUG__ &&
            console.log(
              `MultiDomainsMultiLocales: matching locale not found - trying to get default for this domain. MatchingLocale is now`,
              matchingLocale?.code
            )
        }
      }
    }

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
    if (import.meta.server) {
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

export const runtimeDetectBrowserLanguage = (
  opts: ModulePublicRuntimeConfig['i18n'] = useRuntimeConfig().public.i18n
) => {
  if (opts?.detectBrowserLanguage === false) return false

  return opts?.detectBrowserLanguage
}

/* eslint-enable @typescript-eslint/no-explicit-any */

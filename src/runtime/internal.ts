import { isString, isObject } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import { getRequestProtocol } from 'h3'
import {
  useRequestHeaders,
  useRequestEvent,
  useCookie as useNuxtCookie,
  useRuntimeConfig,
  useNuxtApp,
  useRouter
} from '#imports'
import { NUXT_I18N_MODULE_ID, DEFAULT_COOKIE_KEY, isSSG, localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { findBrowserLocale, getLocalesRegex, getRouteName, regexpPath } from './routing/utils'
import { initCommonComposableOptions } from './utils'
import { createLogger } from '#nuxt-i18n/logger'

import type { Locale } from 'vue-i18n'
import type { DetectBrowserLanguageOptions, LocaleObject } from '#internal-i18n-types'
import type { CookieRef } from 'nuxt/app'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from './types'
import type { CommonComposableOptions } from './utils'

function formatMessage(message: string) {
  return NUXT_I18N_MODULE_ID + ' ' + message
}

export function defineGetter<K extends string | number | symbol, V>(obj: Record<K, V>, key: K, val: V) {
  Object.defineProperty(obj, key, { get: () => val })
}

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
export function parseAcceptLanguage(input: string): string[] {
  // Example input: en-US,en;q=0.9,nb;q=0.8,no;q=0.7
  // Contains tags separated by comma.
  // Each tag consists of locale code (2-3 letter language code) and optionally country code
  // after dash. Tag can also contain score after semicolon, that is assumed to match order
  // so it's not explicitly used.
  return input.split(',').map(tag => tag.split(';')[0])
}

export function getBrowserLocale(): string | undefined {
  // get browser language either from navigator if running on client side, or from the headers
  if (import.meta.client) {
    return findBrowserLocale(normalizedLocales, navigator.languages as string[])
  }

  const { 'accept-language': accept } = useRequestHeaders(['accept-language'])
  return accept ? findBrowserLocale(normalizedLocales, parseAcceptLanguage(accept)) : undefined
}

export function getI18nCookie() {
  const detect = runtimeDetectBrowserLanguage()
  const cookieKey = (detect && detect.cookieKey) || DEFAULT_COOKIE_KEY
  const date = new Date()
  const cookieOptions: Record<string, unknown> = {
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
  const env = import.meta.client ? 'client' : 'server'
  const logger = /*#__PURE__*/ createLogger(`getLocaleCookie:${env}`)
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

type DetectFailureStates =
  | 'not_found_match'
  | 'first_access_only'
  | 'not_redirect_on_root'
  | 'not_redirect_on_no_prefix'
  | 'detect_ignore_on_ssg'
  | 'disabled'

type DetectFromStates = 'cookie' | 'navigator_or_header' | 'fallback'

type DetectBrowserLanguageFromResult = {
  locale: string
  from?: DetectFromStates
  error?: DetectFailureStates
}

export function detectBrowserLanguage(
  route: string | CompatRoute,
  localeCookie: string | undefined,
  locale: Locale = ''
): DetectBrowserLanguageFromResult {
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

  __DEBUG__ && logger.log({ locale, path: typeof route === 'string' ? route : route.path, strategy, ..._detect })

  if (strategy !== 'no_prefix') {
    const path = typeof route === 'string' ? route : route.path

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

export function getHost() {
  if (import.meta.client) {
    return window.location.host
  }

  const header = useRequestHeaders(['x-forwarded-host', 'host'])
  return header['x-forwarded-host'] || header['host'] || ''
}

export function getLocaleDomain(locales: LocaleObject[], strategy: string, route: string | CompatRoute): string {
  const logger = /*#__PURE__*/ createLogger(`getLocaleDomain`)
  const host = getHost()
  const routePath = isObject(route) ? route.path : isString(route) ? route : ''

  if (!host) {
    return host
  }

  __DEBUG__ && logger.log(`locating domain for host`, { host, strategy, path: routePath })

  const matchingLocales = locales.filter(locale => {
    if (locale.domain) {
      return (hasProtocol(locale.domain) ? locale.domain.replace(/(http|https):\/\//, '') : locale.domain) === host
    }
    return Array.isArray(locale?.domains) ? locale.domains.includes(host) : false
  })

  if (matchingLocales.length === 0) {
    return ''
  }

  if (matchingLocales.length === 1) {
    __DEBUG__ && logger.log(`found one matching domain`, { host, matchedLocale: matchingLocales[0].code })
    return matchingLocales[0]?.code ?? ''
  }

  if (strategy === 'no_prefix') {
    console.warn(
      formatMessage(
        'Multiple matching domains found! This is not supported for no_prefix strategy in combination with differentDomains!'
      )
    )
    // Just return the first matching domain locale
    return matchingLocales[0]?.code ?? ''
  }

  // get prefix from route
  if (route) {
    __DEBUG__ && logger.log(`check matched domain for locale match`, { path: routePath, host })

    if (routePath && routePath !== '') {
      const matched = routePath.match(getLocalesRegex(matchingLocales.map(l => l.code)))?.at(1)
      if (matched) {
        const matchingLocale = matchingLocales.find(l => l.code === matched)
        __DEBUG__ && logger.log(`matched locale from path`, { matchedLocale: matchingLocale?.code })
        return matchingLocale?.code ?? ''
      }
    }
  }

  // Fall back to default language on this domain - if set
  const matchingLocale = matchingLocales.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)
  __DEBUG__ && logger.log(`no locale matched - using default for this domain`, { matchedLocale: matchingLocale?.code })

  return matchingLocale?.code ?? ''
}

export function getDomainFromLocale(localeCode: Locale): string | undefined {
  const nuxtApp = useNuxtApp()
  const host = getHost()
  const runtimeI18n = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
  const lang = normalizedLocales.find(locale => locale.code === localeCode)
  // lookup the `differentDomain` origin associated with given locale.
  const domain =
    runtimeI18n?.domainLocales?.[localeCode]?.domain || lang?.domain || lang?.domains?.find(v => v === host)

  if (!domain) {
    console.warn(formatMessage('Could not find domain name for locale ' + localeCode))
    return
  }

  if (hasProtocol(domain, { strict: true })) {
    return domain
  }

  const protocol = import.meta.server
    ? getRequestProtocol(useRequestEvent(nuxtApp)!) + ':'
    : new URL(window.location.origin).protocol

  return protocol + '//' + domain
}

export function runtimeDetectBrowserLanguage(
  opts: I18nPublicRuntimeConfig = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
) {
  if (opts?.detectBrowserLanguage === false) return false

  return opts?.detectBrowserLanguage
}

/**
 * Removes default routes depending on domain
 */
export function setupMultiDomainLocales(runtimeI18n: I18nPublicRuntimeConfig, defaultLocaleDomain: string) {
  const { multiDomainLocales, strategy, routesNameSeparator, defaultLocaleRouteNameSuffix } = runtimeI18n

  // feature disabled
  if (!multiDomainLocales) return

  // incompatible strategy
  if (!(strategy === 'prefix_except_default' || strategy === 'prefix_and_default')) return

  const router = useRouter()
  const defaultRouteSuffix = [routesNameSeparator, defaultLocaleRouteNameSuffix].join('')

  // Adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = getRouteName(route.name)

    if (routeName.endsWith(defaultRouteSuffix)) {
      router.removeRoute(routeName)
      continue
    }

    const routeNameLocale = routeName.split(routesNameSeparator)[1]
    if (routeNameLocale === defaultLocaleDomain) {
      router.addRoute({
        ...route,
        path: route.path === `/${routeNameLocale}` ? '/' : route.path.replace(`/${routeNameLocale}`, '')
      })
    }
  }
}

/**
 * Returns default locale for the current domain, returns `defaultLocale` by default
 */
export function getDefaultLocaleForDomain(runtimeI18n: I18nPublicRuntimeConfig) {
  const { locales, defaultLocale, multiDomainLocales } = runtimeI18n
  const defaultLocaleDomain = defaultLocale || ''

  if (!multiDomainLocales) {
    return defaultLocaleDomain
  }

  const host = getHost()
  if (locales.some(l => typeof l !== 'string' && l.defaultForDomains != null)) {
    const findDefaultLocale = locales.find(
      (l): l is LocaleObject => typeof l !== 'string' && !!l.defaultForDomains?.includes(host)
    )
    return findDefaultLocale?.code ?? ''
  }

  return defaultLocaleDomain
}

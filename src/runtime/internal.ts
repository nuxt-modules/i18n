import { isArray, isString, isObject } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import isHTTPS from 'is-https'
import {
  useRequestHeaders,
  useRequestEvent,
  useCookie as useNuxtCookie,
  useRuntimeConfig,
  useNuxtApp,
  useRouter
} from '#imports'
import { NUXT_I18N_MODULE_ID, DEFAULT_COOKIE_KEY, isSSG, localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { findBrowserLocale, getLocalesRegex, getRouteName } from './routing/utils'
import { initCommonComposableOptions, type CommonComposableOptions } from './utils'
import { createLogger } from 'virtual:nuxt-i18n-logger'

import type { Locale } from 'vue-i18n'
import type { DetectBrowserLanguageOptions, LocaleObject } from '#internal-i18n-types'
import type { CookieRef, NuxtApp } from 'nuxt/app'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from './types'

export function formatMessage(message: string) {
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
  let ret: string | undefined
  const logger = /*#__PURE__*/ createLogger('getBrowserLocale')

  if (import.meta.client) {
    if (navigator.languages) {
      // get browser language either from navigator if running on client side, or from the headers
      ret = findBrowserLocale(normalizedLocales, navigator.languages as string[])
      __DEBUG__ && logger.log('(navigator.languages, ret) -', navigator.languages, ret)
    }
  } else if (import.meta.server) {
    const header = useRequestHeaders(['accept-language'])
    __DEBUG__ && logger.log('accept-language', header)
    const accept = header['accept-language']
    if (accept) {
      ret = findBrowserLocale(normalizedLocales, parseAcceptLanguage(accept))
      __DEBUG__ && logger.log('ret', ret)
    }
  }

  return ret
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

const enum DetectFailure {
  NOT_FOUND = 'not_found_match',
  FIRST_ACCESS = 'first_access_only',
  NO_REDIRECT_ROOT = 'not_redirect_on_root',
  NO_REDIRECT_NO_PREFIX = 'not_redirect_on_no_prefix',
  SSG_IGNORE = 'detect_ignore_on_ssg',
  DISABLED = 'disabled'
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

const DefaultDetectBrowserLanguageFromResult: DetectBrowserLanguageFromResult = {
  locale: '',
  reason: DetectFailure.DISABLED
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
    return DefaultDetectBrowserLanguageFromResult
  }

  const nuxtApp = useNuxtApp()
  const strategy = nuxtApp.$i18n.strategy
  const firstAccess = nuxtApp._vueI18n.__firstAccess

  __DEBUG__ && logger.log({ firstAccess })

  // detection ignored during nuxt generate
  if (isSSG && firstAccess && strategy === 'no_prefix' && import.meta.server) {
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
  const browserMatch = nuxtApp.$i18n.getBrowserLocale()
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

export function getLocaleDomain(locales: LocaleObject[], strategy: string, route: string | CompatRoute): string {
  const logger = /*#__PURE__*/ createLogger(`getLocaleDomain`)
  let host = getHost() || ''
  const routePath = isObject(route) ? route.path : isString(route) ? route : ''

  if (host) {
    __DEBUG__ && logger.log(`locating domain for host`, { host, strategy, path: routePath })

    let matchingLocale: LocaleObject | undefined
    const matchingLocales = locales.filter(locale => {
      if (locale && locale.domain) {
        let domain = locale.domain
        if (hasProtocol(locale.domain)) {
          domain = locale.domain.replace(/(http|https):\/\//, '')
        }
        return domain === host
      } else if (Array.isArray(locale?.domains)) {
        return locale.domains.includes(host)
      }
      return false
    })

    if (matchingLocales.length === 1) {
      matchingLocale = matchingLocales[0]
      __DEBUG__ && logger.log(`found one matching domain`, { host, matchedLocale: matchingLocales[0].code })
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
          __DEBUG__ && logger.log(`check matched domain for locale match`, { path: routePath, host })

          if (routePath && routePath !== '') {
            const matches = routePath.match(getLocalesRegex(matchingLocales.map(l => l.code)))
            if (matches && matches.length > 1) {
              matchingLocale = matchingLocales.find(l => l.code === matches[1])
              __DEBUG__ && logger.log(`matched locale from path`, { matchedLocale: matchingLocale?.code })
            }
          }
        }

        if (!matchingLocale) {
          // Fall back to default language on this domain - if set
          matchingLocale = matchingLocales.find(l =>
            Array.isArray(l.defaultForDomains) ? l.defaultForDomains.includes(host) : l.domainDefault
          )
          __DEBUG__ &&
            logger.log(`no locale matched - using default for this domain`, { matchedLocale: matchingLocale?.code })
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
  const host = getHost()
  // lookup the `differentDomain` origin associated with given locale.
  const config = runtimeConfig.public.i18n as I18nPublicRuntimeConfig
  const lang = normalizedLocales.find(locale => locale.code === localeCode)
  const domain = config?.domainLocales?.[localeCode]?.domain || lang?.domain || lang?.domains?.find(v => v === host)

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
  opts: I18nPublicRuntimeConfig = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
) => {
  if (opts?.detectBrowserLanguage === false) return false

  return opts?.detectBrowserLanguage
}

/**
 * Removes default routes depending on domain
 */
export function setupMultiDomainLocales(nuxtContext: NuxtApp, defaultLocaleDomain: string) {
  const { multiDomainLocales, strategy, routesNameSeparator, defaultLocaleRouteNameSuffix } = nuxtContext.$config.public
    .i18n as I18nPublicRuntimeConfig

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
export function getDefaultLocaleForDomain(nuxtContext: NuxtApp) {
  const { locales, defaultLocale, multiDomainLocales } = nuxtContext.$config.public.i18n as I18nPublicRuntimeConfig

  let defaultLocaleDomain: string = defaultLocale || ''

  if (!multiDomainLocales) {
    return defaultLocaleDomain
  }

  const host = getHost()
  const hasDefaultForDomains = locales.some(
    (l): l is LocaleObject => typeof l !== 'string' && Array.isArray(l.defaultForDomains)
  )

  if (hasDefaultForDomains) {
    const findDefaultLocale = locales.find((l): l is LocaleObject =>
      typeof l === 'string' || !Array.isArray(l.defaultForDomains) ? false : l.defaultForDomains.includes(host ?? '')
    )

    defaultLocaleDomain = findDefaultLocale?.code ?? ''
  }

  return defaultLocaleDomain
}

import { getCookie, getRequestHeader, getRequestURL } from 'h3'
import { parsePath } from 'ufo'
import { getLocaleFromRoute, getLocaleFromRoutePath } from '#i18n-kit/routing'
import { findBrowserLocale } from '#i18n-kit/browser'
import { parseAcceptLanguage } from '@intlify/utils'
import { cookieSpansDomains, isLocaleOnHost, isLocaleServedOnHost, matchDomainLocale } from './domain'
import { isString } from '@intlify/shared'
import { isSupportedLocale } from './locales'
import type { useI18nDetection } from '../shared/utils'
import type { NormalizedLocaleObject } from '../../types'

import type { H3Event } from 'h3'
import type { CompatRoute } from '../types'
import { useCookie } from '#app'

// TODO: add unit tests for these detectors

const getCookieLocale = (event: H3Event | undefined, cookieName: string): string | undefined =>
  (import.meta.client ? useCookie(cookieName).value : getCookie(event!, cookieName)) || undefined

const getRouteLocale = (event: H3Event | undefined, route: string | CompatRoute): string | undefined =>
  getLocaleFromRoute(route)

const getHeaderLocale = (event: H3Event | undefined, locales: NormalizedLocaleObject[]) =>
  findBrowserLocale(locales, parseAcceptLanguage(getRequestHeader(event!, 'accept-language') || ''))

const getNavigatorLocale = (event: H3Event | undefined, locales: NormalizedLocaleObject[]) =>
  findBrowserLocale(locales, navigator.languages)

const getRequestHost = (event: H3Event | undefined) =>
  import.meta.client ? new URL(window.location.href).host : getRequestURL(event!, { xForwardedHost: true }).host

const getRefererHost = (event: H3Event | undefined): string | undefined => {
  const referer = import.meta.client ? document.referrer : getRequestHeader(event!, 'referer')
  try {
    return (referer && new URL(referer).host) || undefined
  } catch {
    return undefined
  }
}

export const useDetectors = (
  event: H3Event | undefined,
  config: { cookieKey: string, cookieDomain?: string | null },
  locales: NormalizedLocaleObject[],
) => {
  if (import.meta.server && !event) {
    throw new Error('H3Event is required for server-side locale detection')
  }

  // constant for the lifetime of these detectors, a fresh set is created per request
  let host: string | undefined
  const getHost = () => (host ??= getRequestHost(event))

  return {
    cookie: () => getCookieLocale(event, config.cookieKey),
    header: () => (import.meta.server ? getHeaderLocale(event, locales) : undefined),
    navigator: () => (import.meta.client ? getNavigatorLocale(event, locales) : undefined),
    supports: (locale: string) => locales.some(l => l.code === locale),
    host: (path: string) => matchDomainLocale(locales, getHost(), getLocaleFromRoutePath(path)),
    route: (path: string | CompatRoute) => getRouteLocale(event, path),
    /** Passes the locale through when the current host serves it, `undefined` otherwise */
    onHost: (locale: string | null | undefined) =>
      !locale || isLocaleServedOnHost(locales, getHost(), locale) ? locale : undefined,
    /** Whether the visitor arrived from one of the configured domains */
    fromOwnDomain: () => {
      const referer = getRefererHost(event)
      return !!referer && locales.some(l => isLocaleOnHost(l, referer))
    },
    /** Whether a cookie scoped to the configured `cookieDomain` is readable on every domain */
    cookieSpans: () => !!config.cookieDomain && cookieSpansDomains(locales, config.cookieDomain),
  }
}

export type LocaleDetectorConfig = {
  detection: ReturnType<typeof useI18nDetection>
  /** @default `isSupportedLocale` */
  isSupportedLocale?: (locale?: string) => boolean
  /** Whether routes are localized (pages enabled and strategy is not `no_prefix`) */
  routing: boolean
  /** Whether locales are resolved from domains */
  domains: boolean
}

export function createLocaleDetector(config: LocaleDetectorConfig) {
  const { detection, routing, domains } = config
  const isSupported = config.isSupportedLocale ?? isSupportedLocale

  /**
   * Gates locale adoption rather than redirection - a detected locale is only applied where
   * `redirectOn` allows the URL to follow, otherwise app state and URL would disagree
   * (e.g. cookie locale content rendered on a default-locale path). The redirect action
   * itself is gated separately (see the redirect switch in `createRedirectResolver`).
   */
  function skipDetect(path: string, pathLocale: string | undefined): boolean {
    // no routes - force detection
    if (!routing) {
      return false
    }

    // detection only on root
    if (detection.redirectOn === 'root' && path !== '/') {
      return true
    }

    // detection only on unprefixed route
    if (detection.redirectOn === 'no prefix' && !detection.alwaysRedirect && isSupported(pathLocale)) {
      return true
    }

    return false
  }

  /**
   * Returns the detected locale for `route`, or an empty string when no supported locale is detected
   */
  return function detectLocale(detectors: ReturnType<typeof useDetectors>, route: string | CompatRoute, initial: boolean): string {
    // route objects carry a query-free `path`, server paths may include a query string
    const path = isString(route) ? parsePath(route).pathname : route.path

    const pass = (locale: string | null | undefined) => locale
    const onHost = domains ? detectors.onHost : pass

    function* detect() {
      const detecting = initial && detection.enabled && !skipDetect(path, detectors.route(path))
      if (detecting) {
        // only an external arrival may follow a source off-host (an internal one already chose
        // its destination), and only sources reading the same on every domain - per-host cookies
        // can disagree and would have two hosts redirect at each other indefinitely
        const external = domains && !detectors.fromOwnDomain()
        const cookie = external && detectors.cookieSpans() ? pass : onHost
        const browser = external ? pass : onHost
        yield cookie(detectors.cookie())
        yield browser(detectors.header())
        yield browser(detectors.navigator())
      }

      if (domains) {
        yield detectors.host(path)
      }

      if (routing) {
        yield detectors.route(route)
      }

      // the detection fallback only applies when no other source resolves (e.g. root or
      // unprefixed paths), the route locale is not overridden by a failed browser detection
      if (detecting) {
        yield onHost(detection.fallbackLocale)
      }
    }

    for (const detected of detect()) {
      if (detected && isSupported(detected) && detectors.supports(detected)) {
        return detected
      }
    }

    return ''
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { getCookie, getRequestHeader, getRequestURL } from 'h3'
import { parsePath } from 'ufo'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { getLocaleFromRoute, getLocaleFromRoutePath } from '#i18n-kit/routing'
import { findBrowserLocale } from '#i18n-kit/browser'
import { parseAcceptLanguage } from '@intlify/utils'
import { matchDomainLocale } from './domain'
import { isString } from '@intlify/shared'
import { isSupportedLocale } from './locales'
import { type useI18nDetection, useRuntimeI18n } from '../shared/utils'
import type { I18nPublicRuntimeConfig } from '../../types'

import type { H3Event } from 'h3'
import type { CompatRoute } from '../types'
import { type NuxtApp, useCookie } from '#app'

// TODO: add unit tests for these detectors

const getCookieLocale = (event: H3Event | undefined, cookieName: string): string | undefined =>
  (import.meta.client ? useCookie(cookieName).value : getCookie(event!, cookieName)) || undefined

const getRouteLocale = (event: H3Event | undefined, route: string | CompatRoute): string | undefined =>
  getLocaleFromRoute(route)

const getHeaderLocale = (event: H3Event | undefined) =>
  findBrowserLocale(normalizedLocales, parseAcceptLanguage(getRequestHeader(event!, 'accept-language') || ''))

const getNavigatorLocale = (event: H3Event | undefined) => findBrowserLocale(normalizedLocales, navigator.languages)

const getHostLocale = (
  event: H3Event | undefined,
  path: string,
  domainLocales: I18nPublicRuntimeConfig['domainLocales'],
) => {
  const host = import.meta.client
    ? new URL(window.location.href).host
    : getRequestURL(event!, { xForwardedHost: true }).host

  const locales = normalizedLocales.map(l => ({
    ...l,
    domain: domainLocales[l.code]?.domain ?? l.domain,
  }))
  return matchDomainLocale(locales, host, getLocaleFromRoutePath(path))
}

export const useDetectors = (event: H3Event | undefined, config: { cookieKey: string }, nuxtApp?: NuxtApp) => {
  if (import.meta.server && !event) {
    throw new Error('H3Event is required for server-side locale detection')
  }

  const runtimeI18n = useRuntimeI18n(nuxtApp)

  return {
    cookie: () => getCookieLocale(event, config.cookieKey),
    header: () => (import.meta.server ? getHeaderLocale(event) : undefined),
    navigator: () => (import.meta.client ? getNavigatorLocale(event) : undefined),
    host: (path: string) => getHostLocale(event, path, runtimeI18n.domainLocales),
    route: (path: string | CompatRoute) => getRouteLocale(event, path),
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

    function* detect() {
      const detecting = initial && detection.enabled && !skipDetect(path, detectors.route(path))
      if (detecting) {
        yield detectors.cookie()
        yield detectors.header()
        yield detectors.navigator()
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
        yield detection.fallbackLocale
      }
    }

    for (const detected of detect()) {
      if (detected && isSupported(detected)) {
        return detected
      }
    }

    return ''
  }
}

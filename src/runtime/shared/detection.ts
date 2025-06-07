/* eslint-disable @typescript-eslint/no-unused-vars */
import { getRequestURL, getRequestHeader } from 'h3'
import { normalizedLocales } from '#build/i18n.options.mjs'
import { getLocaleFromRoute, getLocaleFromRoutePath } from '#i18n-kit/routing'
import { findBrowserLocale } from '#i18n-kit/browser'
import { parseAcceptLanguage } from '@intlify/utils'
import { matchDomainLocale } from './domain'
import { parse } from 'cookie-es'

import type { H3Event } from 'h3'
import type { CompatRoute } from '../types'

// TODO: add unit tests for these detectors

const getCookieLocale = (event: H3Event | undefined, cookieName: string): string | undefined => {
  const cookieValue = import.meta.client ? document.cookie : getRequestHeader(event!, 'cookie') || ''
  return parse(cookieValue)[cookieName]
}

const getRouteLocale = (event: H3Event | undefined, route: string | CompatRoute): string | undefined =>
  getLocaleFromRoute(route)

const getHeaderLocale = (event: H3Event | undefined) => {
  return findBrowserLocale(normalizedLocales, parseAcceptLanguage(getRequestHeader(event!, 'accept-language') || ''))
}

const getNavigatorLocale = (event: H3Event | undefined) => {
  return findBrowserLocale(normalizedLocales, navigator.languages)
}

const getHostLocale = (event: H3Event | undefined, path: string) => {
  const host = import.meta.client
    ? new URL(window.location.href).host
    : getRequestURL(event!, { xForwardedHost: true }).host
  return matchDomainLocale(normalizedLocales, host, getLocaleFromRoutePath(path))
}

export const useDetectors = (event: H3Event | undefined, config: { cookieKey: string }) => {
  if (import.meta.server && !event) {
    throw new Error('H3Event is required for server-side locale detection')
  }

  return {
    cookie: () => getCookieLocale(event, config.cookieKey),
    header: () => (import.meta.server ? getHeaderLocale(event) : undefined),
    navigator: () => (import.meta.client ? getNavigatorLocale(event) : undefined),
    host: (path: string) => getHostLocale(event, path),
    route: (path: string | CompatRoute) => getRouteLocale(event, path)
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { getCookie, getRequestHeader, getRequestURL } from 'h3'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { getLocaleFromRoute, getLocaleFromRoutePath } from '#i18n-kit/routing'
import { findBrowserLocale } from '#i18n-kit/browser'
import { parseAcceptLanguage } from '@intlify/utils'
import { matchDomainLocale } from './domain'
import { useRuntimeI18n } from '../shared/utils'
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

import { isString } from '@intlify/shared'
import { useCookie, useRequestHeader, useRuntimeConfig } from '#imports'
import { localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { findBrowserLocale, parseAcceptLanguage } from '#i18n-kit/browser'

import type { DetectBrowserLanguageOptions, I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CookieRef } from 'nuxt/app'
import type { CompatRoute } from './types'

export function getCompatRoutePath(route: string | CompatRoute) {
  return isString(route) ? route : route.path
}

export function getBrowserLocale(): string | undefined {
  // get browser language either from navigator if running on client side, or from the headers
  const browserLocales = import.meta.client
    ? navigator.languages
    : parseAcceptLanguage(useRequestHeader('accept-language'))
  return (
    findBrowserLocale(
      normalizedLocales.map(x => ({ code: x.code, language: x.language ?? x.code })),
      browserLocales
    ) || undefined
  )
}

export function createI18nCookie(runtimeI18n = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig) {
  const { cookieCrossOrigin, cookieDomain, cookieSecure, cookieKey } = runtimeI18n.detectBrowserLanguage || {}
  const date = new Date()
  return useCookie<string | undefined>(cookieKey || __DEFAULT_COOKIE_KEY__, {
    path: '/',
    readonly: false,
    expires: new Date(date.setDate(date.getDate() + 365)),
    sameSite: cookieCrossOrigin ? 'none' : 'lax',
    domain: cookieDomain || undefined,
    secure: cookieCrossOrigin || cookieSecure
  })
}

export function getLocaleCookie(
  cookieRef: CookieRef<string | undefined>,
  detect: false | DetectBrowserLanguageOptions
): string | undefined {
  if (!detect || !detect.useCookie || cookieRef.value == null) {
    return
  }

  if (localeCodes.includes(cookieRef.value)) {
    return cookieRef.value
  }
}

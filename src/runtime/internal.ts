import { isString } from '@intlify/shared'
import { useCookie, useRequestHeader, useRuntimeConfig } from '#imports'
import { localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { findBrowserLocale, parseAcceptLanguage } from '#i18n-kit/browser'
import { createLogger } from '#nuxt-i18n/logger'

import type { DetectBrowserLanguageOptions, I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CookieOptions, CookieRef } from 'nuxt/app'
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

export function createI18nCookie() {
  const detect = (useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig).detectBrowserLanguage
  const cookieKey = (detect && detect.cookieKey) || __DEFAULT_COOKIE_KEY__
  const date = new Date()
  const cookieOptions: CookieOptions<string | undefined> & { readonly: false } = {
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
  cookieRef: CookieRef<string | undefined>,
  detect: false | DetectBrowserLanguageOptions,
  defaultLocale: string
): string | undefined {
  const { useCookie, cookieKey } = detect || {}
  const logger = /*#__PURE__*/ createLogger(`getLocaleCookie:${import.meta.client ? 'client' : 'server'}`)
  __DEBUG__ && logger.log({ useCookie, cookieKey, localeCodes })

  if (!useCookie) {
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

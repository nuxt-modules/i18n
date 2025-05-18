import { isString } from '@intlify/shared'
import { useCookie, useRuntimeConfig } from '#imports'

import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from './types'

export function getCompatRoutePath(route: string | CompatRoute) {
  return isString(route) ? route : route.path
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

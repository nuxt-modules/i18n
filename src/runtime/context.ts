import { isRef, unref } from 'vue'

import { useNuxtApp, useState, useCookie, useRequestHeader } from '#imports'
import { localeCodes, localeLoaders, normalizedLocales } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from './shared/messages'
import { createBaseUrlGetter } from './utils'
import { getLocaleFromRoute } from '#i18n-kit/routing'
import { findBrowserLocale } from '#i18n-kit/browser'
import { parseAcceptLanguage } from '@intlify/utils'
import { getI18nTarget } from './compatibility'
import { createDomainFromLocaleGetter, createDomainLocaleGetter } from './domain'
import { joinURL } from 'ufo'
import { isString } from '@intlify/shared'

import type { Locale, I18n } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type {
  DetectBrowserLanguageOptions,
  I18nPublicRuntimeConfig,
  LocaleObject,
  RootRedirectOptions
} from '#internal-i18n-types'
import type { CompatRoute } from './types'

export const useLocaleConfigs = () =>
  useState<Record<string, { cacheable: boolean; fallbacks: string[] }>>('i18n:cached-locale-configs', () => ({}))

/**
 * @internal
 */
export type NuxtI18nContext = {
  vueI18n: I18n
  config: I18nPublicRuntimeConfig
  detection: DetectBrowserLanguageOptions & { enabled: boolean }
  /** Locale messages attached during SSR and loaded during hydration */
  preloaded: boolean
  /** Initial request/visit */
  firstAccess: boolean
  /** SSG with dynamic locale resources */
  dynamicResourcesSSG: boolean
  rootRedirect: { path: string; code: number } | undefined
  /** Get default locale */
  getDefaultLocale: () => string
  /** Get current locale */
  getLocale: () => string
  /** Set locale directly  */
  setLocale: (locale: string) => Promise<void>
  /** Set locale - suspend if `skipSettingLocaleOnNavigate` is enabled  */
  setLocaleSuspend: (locale: string) => Promise<void>
  /** Get normalized runtime locales */
  getLocales: () => LocaleObject[]
  /** Get locale from locale cookie */
  getCookieLocale: () => string | undefined
  /** Set locale to locale cookie */
  setCookieLocale: (locale: string) => void
  getDomainLocale: (path: string) => string | undefined
  getBrowserLocale: () => string
  /** Get locale from route path or object */
  getRouteLocale: (route: string | CompatRoute) => string
  /** Get current base URL */
  getBaseUrl: (locale?: string) => string
  /** Load locale messages */
  loadMessages: (locale: Locale) => Promise<void>
  _loadMessagesFromClient: (locale: Locale) => Promise<void>
  _loadMessagesFromServer: (locale: Locale) => Promise<void>
  isSupportedLocale: (locale: string) => boolean
}

function createI18nCookie({ cookieCrossOrigin, cookieDomain, cookieSecure, cookieKey }: DetectBrowserLanguageOptions) {
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

function resolveRootRedirect(config: string | RootRedirectOptions | undefined) {
  if (!config) return undefined
  return {
    path: '/' + (isString(config) ? config : config.path).replace(/^\//, ''),
    code: (!isString(config) && config.statusCode) || 302
  }
}

export function createNuxtI18nContext(nuxt: NuxtApp, vueI18n: I18n, defaultLocale: string): NuxtI18nContext {
  const i18n = getI18nTarget(vueI18n)
  const serverLocaleConfigs = useLocaleConfigs()
  const runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
  const detectBrowserLanguage = runtimeI18n.detectBrowserLanguage || {}
  const localeCookie = createI18nCookie(detectBrowserLanguage)

  /** Get computed config for locale */
  const getLocaleConfig = (locale: string) => serverLocaleConfigs.value[locale]
  const getDomainFromLocale = createDomainFromLocaleGetter(runtimeI18n.domainLocales)
  const baseUrl = createBaseUrlGetter(nuxt, runtimeI18n.baseUrl, defaultLocale, getDomainFromLocale)

  const ctx: NuxtI18nContext = {
    vueI18n,
    preloaded: false,
    firstAccess: true,
    config: runtimeI18n,
    detection: { ...detectBrowserLanguage, enabled: !!runtimeI18n.detectBrowserLanguage },
    rootRedirect: resolveRootRedirect(runtimeI18n.rootRedirect),
    dynamicResourcesSSG: !__IS_SSR__ || (!__I18N_FULL_STATIC__ && (import.meta.prerender || __IS_SSG__)),
    isSupportedLocale: (locale: string) => localeCodes.includes(locale),
    getDefaultLocale: () => defaultLocale,
    getLocale: () => unref(i18n.locale),
    setLocale: async (locale: string) => {
      const oldLocale = ctx.getLocale()
      if (locale === oldLocale || !ctx.isSupportedLocale(locale)) return

      if (isRef(i18n.locale)) {
        i18n.locale.value = locale
      } else {
        i18n.locale = locale
      }

      await nuxt.callHook('i18n:localeSwitched', { newLocale: locale, oldLocale })
    },
    setLocaleSuspend: async (locale: string) => {
      if (!ctx.isSupportedLocale(locale)) return

      ctx.vueI18n.__pendingLocale = locale
      ctx.vueI18n.__pendingLocalePromise = new Promise(resolve => {
        ctx.vueI18n.__resolvePendingLocalePromise = async () => {
          // TODO: always syncing cookie may be undesirable, consider making this configurable
          ctx.setCookieLocale(locale)
          await ctx.setLocale(locale)
          ctx.vueI18n.__pendingLocale = undefined
          resolve()
        }
      })

      if (import.meta.server || !ctx.config.skipSettingLocaleOnNavigate) {
        await ctx.vueI18n.__resolvePendingLocalePromise?.()
      }
    },
    getLocales: () => unref(i18n.locales).map(x => (isString(x) ? { code: x } : x)),
    getDomainLocale: createDomainLocaleGetter(normalizedLocales),
    getRouteLocale: route => {
      const locale = getLocaleFromRoute(route)
      return ctx.isSupportedLocale(locale) ? locale : ''
    },
    getCookieLocale: () => {
      if (ctx.detection.useCookie && ctx.isSupportedLocale(localeCookie.value || '')) {
        return localeCookie.value
      }
    },
    setCookieLocale: (locale: string) => {
      if (ctx.detection.useCookie && ctx.isSupportedLocale(locale)) {
        localeCookie.value = locale
      }
    },
    getBaseUrl: (locale?: string) => {
      if (locale) {
        return joinURL(getDomainFromLocale(locale) || baseUrl(), nuxt.$config.app.baseURL)
      }
      return joinURL(baseUrl(), nuxt.$config.app.baseURL)
    },
    getBrowserLocale: () => {
      // from navigator or request header
      const languages = import.meta.client
        ? navigator.languages
        : parseAcceptLanguage(useRequestHeader('accept-language') || '')

      return findBrowserLocale(
        normalizedLocales.map(x => ({ code: x.code, language: x.language ?? x.code })),
        languages
      )
    },
    _loadMessagesFromClient: async (locale: string) => {
      const locales = getLocaleConfig(locale)?.fallbacks ?? []
      if (!locales.includes(locale)) locales.push(locale)
      for (const k of locales) {
        const msg = await nuxt.runWithContext(() => getLocaleMessagesMergedCached(k, localeLoaders[k]))
        i18n.mergeLocaleMessage(k, msg)
      }
    },
    _loadMessagesFromServer: async (locale: string) => {
      if (locale in localeLoaders === false) return
      const headers: HeadersInit = getLocaleConfig(locale)?.cacheable ? {} : { 'Cache-Control': 'no-cache' }
      const messages = await $fetch(`/_i18n/${locale}/messages.json`, { headers })
      for (const k of Object.keys(messages)) {
        i18n.mergeLocaleMessage(k, messages[k])
      }
    },
    loadMessages: async (locale: string) => {
      try {
        return ctx.dynamicResourcesSSG || import.meta.dev
          ? await ctx._loadMessagesFromClient(locale)
          : await ctx._loadMessagesFromServer(locale)
      } catch (e) {
        console.warn(`Failed to load messages for locale "${locale}"`, e)
      }
    }
  }
  return ctx
}

export function useNuxtI18nContext(nuxt: NuxtApp = useNuxtApp()) {
  if (nuxt._nuxtI18nCtx == null) {
    throw new Error('Nuxt I18n context has not been set up yet.')
  }
  return nuxt._nuxtI18nCtx
}

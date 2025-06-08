import { isRef, unref } from 'vue'

import { useNuxtApp, useState, useCookie, useRequestURL } from '#imports'
import { localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from './shared/messages'
import { createBaseUrlGetter } from './utils'
import { getI18nTarget } from './compatibility'
import { domainFromLocale } from './shared/domain'
import { isSupportedLocale } from './shared/locales'
import { useI18nDetection, useRuntimeI18n } from './shared/utils'
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

export const useLocaleConfigs = () =>
  useState<Record<string, { cacheable: boolean; fallbacks: string[] }> | undefined>(
    'i18n:cached-locale-configs',
    () => undefined
  )

export const useResolvedLocale = () => useState<string>('i18n:resolved-locale', () => '')

/**
 * @internal
 */
export interface NuxtI18nContext {
  vueI18n: I18n
  config: I18nPublicRuntimeConfig
  /** Initial request/visit */
  initial: boolean
  /** Locale messages attached during SSR and loaded during hydration */
  preloaded: boolean
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
  /** Set locale to locale cookie */
  setCookieLocale: (locale: string) => void
  /** Get current base URL */
  getBaseUrl: (locale?: string) => string
  /** Load locale messages */
  loadMessages: (locale: Locale) => Promise<void>
  _loadMessagesFromClient: (locale: Locale) => Promise<void>
  _loadMessagesFromServer: (locale: Locale) => Promise<void>
}

function useI18nCookie({ cookieCrossOrigin, cookieDomain, cookieSecure, cookieKey }: DetectBrowserLanguageOptions) {
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
  const runtimeI18n = useRuntimeI18n()
  const detectConfig = useI18nDetection()
  const serverLocaleConfigs = useLocaleConfigs()
  const localeCookie = useI18nCookie(detectConfig)

  /** Get computed config for locale */
  const getLocaleConfig = (locale: string) => serverLocaleConfigs.value![locale]
  const getDomainFromLocale = (locale: string) =>
    domainFromLocale(runtimeI18n.domainLocales, useRequestURL({ xForwardedHost: true }), locale)
  const baseUrl = createBaseUrlGetter(nuxt, runtimeI18n.baseUrl, defaultLocale, getDomainFromLocale)
  const resolvedLocale = useResolvedLocale()

  const ctx: NuxtI18nContext = {
    vueI18n,
    initial: true,
    preloaded: false,
    config: runtimeI18n,
    rootRedirect: resolveRootRedirect(runtimeI18n.rootRedirect),
    dynamicResourcesSSG: !__IS_SSR__ || (!__I18N_FULL_STATIC__ && (import.meta.prerender || __IS_SSG__)),
    getDefaultLocale: () => defaultLocale,
    getLocale: () => unref(i18n.locale),
    setLocale: async (locale: string) => {
      const oldLocale = ctx.getLocale()
      if (locale === oldLocale || !isSupportedLocale(locale)) return

      if (isRef(i18n.locale)) {
        i18n.locale.value = locale
      } else {
        i18n.locale = locale
      }

      await nuxt.callHook('i18n:localeSwitched', { newLocale: locale, oldLocale })

      resolvedLocale.value = locale
    },
    setLocaleSuspend: async (locale: string) => {
      if (!isSupportedLocale(locale)) return

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
    setCookieLocale: (locale: string) => {
      if (detectConfig.useCookie && isSupportedLocale(locale)) {
        localeCookie.value = locale
      }
    },
    getBaseUrl: (locale?: string) => {
      if (locale) {
        return joinURL(getDomainFromLocale(locale) || baseUrl(), nuxt.$config.app.baseURL)
      }
      return joinURL(baseUrl(), nuxt.$config.app.baseURL)
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

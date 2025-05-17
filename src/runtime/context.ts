import { isRef, unref } from 'vue'

import { useNuxtApp, useState } from '#imports'
import { localeCodes, localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from './shared/messages'
import { createBaseUrlGetter } from './utils'
import { createLocaleFromRouteGetter } from '#i18n-kit/routing'
import { getI18nTarget } from './compatibility'
import { createDomainFromLocaleGetter } from './domain'
import { joinURL } from 'ufo'

import type { Locale, I18n } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { LocaleObject } from '#internal-i18n-types'
import type { CompatRoute } from './types'
import { isString } from '@intlify/shared'

export const useLocaleConfigs = () =>
  useState<Record<string, { cacheable: boolean; fallbacks: string[] }>>('i18n:cached-locale-configs', () => ({}))

/**
 * @internal
 */
export type NuxtI18nContext = {
  /** Locale messages attached during SSR and loaded during hydration */
  preloaded: boolean
  /** Initial request/visit */
  firstAccess: boolean
  /** SSG with dynamic locale resources */
  dynamicResourcesSSG: boolean
  getVueI18n: () => I18n
  /** Load locale messages */
  loadLocaleMessages: (locale: Locale) => Promise<void>
  /** Get current locale */
  getLocale: () => string
  /** Set locale directly  */
  setLocale: (locale: string) => void
  /** Get normalized runtime locales */
  getLocales: () => LocaleObject[]
  /** Get locale from route path or object */
  getLocaleFromRoute: (route: string | CompatRoute) => string
  /** Get current base URL */
  getBaseUrl: () => string
  /** Get domain associated with locale */
  getDomainFromLocale: (locale: Locale) => string | undefined
}

export function createNuxtI18nContext(nuxt: NuxtApp, _i18n: I18n): NuxtI18nContext {
  const i18n = getI18nTarget(_i18n)
  const serverLocaleConfigs = useLocaleConfigs()

  const dynamicResourcesSSG = !__I18N_FULL_STATIC__ && (import.meta.prerender || __IS_SSG__)
  /** Get computed config for locale */
  const getLocaleConfig = (locale: string) => serverLocaleConfigs.value[locale]
  const getDomainFromLocale = createDomainFromLocaleGetter(nuxt)
  const baseUrl = createBaseUrlGetter(nuxt, getDomainFromLocale)

  return {
    firstAccess: true,
    preloaded: false,
    dynamicResourcesSSG,
    getVueI18n: () => _i18n,
    getLocale: () => unref(i18n.locale),
    setLocale: (locale: string) => {
      if (isRef(i18n.locale)) {
        i18n.locale.value = locale
      } else {
        i18n.locale = locale
      }
    },
    getLocales: () => unref(i18n.locales).map(x => (isString(x) ? { code: x } : x)),
    getLocaleFromRoute: createLocaleFromRouteGetter({
      separator: __ROUTE_NAME_SEPARATOR__,
      defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__,
      localeCodes
    }),
    getBaseUrl: () => joinURL(baseUrl(), nuxt.$config.app.baseURL),
    getDomainFromLocale,
    loadLocaleMessages: async (locale: string) => {
      if (dynamicResourcesSSG || import.meta.dev) {
        const locales = getLocaleConfig(locale)?.fallbacks ?? []
        if (!locales.includes(locale)) {
          locales.push(locale)
        }
        for (const entry of locales) {
          i18n.mergeLocaleMessage(
            entry,
            await nuxt.runWithContext(() => getLocaleMessagesMergedCached(entry, localeLoaders[entry]))
          )
        }
        return
      }

      const headers = new Headers()
      if (!getLocaleConfig(locale)?.cacheable) {
        headers.set('Cache-Control', 'no-cache')
      }

      try {
        const messages = await $fetch(`/_i18n/${locale}/messages.json`, { headers })
        for (const locale of Object.keys(messages)) {
          i18n.mergeLocaleMessage(locale, messages[locale])
        }
      } catch (e) {
        console.warn('Failed to load messages for locale', locale, e)
      }
    }
  }
}

export function useNuxtI18nContext(nuxt: NuxtApp = useNuxtApp()) {
  if (nuxt._nuxtI18nCtx == null) {
    throw new Error('Nuxt I18n context has not been set up yet.')
  }
  return nuxt._nuxtI18nCtx
}

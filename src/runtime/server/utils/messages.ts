import { deepCopy } from '@intlify/shared'
import { defineCachedFunction } from 'nitropack/runtime'
import { localeLoaders } from '#internal/i18n/options.mjs'
import { loadAndSetLocaleMessages } from '../../messages'

import type { LocaleMessages } from '@intlify/core'

/**
 * Load messages for the specified locale
 * @param locale - The locale to load messages for
 */
const cachedMessages = defineCachedFunction(
  async (locale: string) => {
    return await loadAndSetLocaleMessages(locale, localeLoaders)
  },
  {
    name: 'i18n:loadMessages',
    getKey: locale => `${locale}`,
    shouldBypassCache: locale => !isLocaleCacheable(locale)
  }
)

/**
 * Load messages for the specified locale and merge with fallback locales
 * @param locale - The locale to load messages for
 * @param fallbackLocales - The fallback locales to merge with
 */
export const cachedMergedMessages = defineCachedFunction(
  async (locale: string, fallbackLocales: string[]) => {
    const merged = {} as LocaleMessages<Record<string, string>>

    if (fallbackLocales.length > 0) {
      const messages = await Promise.all(fallbackLocales.map(cachedMessages))
      for (const message of messages) {
        deepCopy(message, merged)
      }
    }

    const message = await cachedMessages(locale)
    try {
      deepCopy(message, merged)
    } catch (e) {
      console.error('Failed to merge messages:', e, message, locale)
    }

    return merged
  },
  {
    name: 'i18n:loadMergedMessages',
    getKey: (locale, fallbackLocales) => `${locale}-[${fallbackLocales.join('-')}]`,
    shouldBypassCache: (locale, fallbackLocales) => {
      return !isLocaleCacheable(locale) || !fallbackLocales.every(fallbackLocale => isLocaleCacheable(fallbackLocale))
    }
  }
)

/**
 * Check if the loaders for the specified locale are all cacheable
 */
export function isLocaleCacheable(locale: string) {
  return localeLoaders[locale] == null || localeLoaders[locale].some(loader => loader.cache !== false)
}

import { deepCopy } from '@intlify/shared'
import { defineCachedFunction } from 'nitropack/runtime'
import { localeCodes, localeLoaders } from '#internal/i18n/options.mjs'
import { getLocaleMessagesMerged } from '../../messages'

import type { LocaleMessages } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'

/**
 * Load messages for the specified locale
 * @param locale - The locale to load messages for
 */
const cachedMessages = defineCachedFunction(
  async (locale: string) => {
    return { [locale]: await getLocaleMessagesMerged(locale, localeLoaders[locale]) }
  },
  {
    name: 'i18n:loadMessages',
    maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
    getKey: locale => locale,
    shouldBypassCache(locale) {
      return !isLocaleCacheable(locale)
    }
  }
)

/**
 * Load messages for the specified locale and merge with fallback locales
 * @param locale - The locale to load messages for
 * @param fallbackLocales - The fallback locales to merge with
 */
export const getMergedMessages = async (locale: string, fallbackLocales: string[]) => {
  const merged = {} as LocaleMessages<DefineLocaleMessage>

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
}

/**
 * Check if the loaders for the specified locale are all cacheable
 */
export function isLocaleCacheable(locale: string) {
  return localeLoaders[locale] != null && localeLoaders[locale].every(loader => loader.cache !== false)
}

export function isLocaleWithFallbacksCacheable(locale: string, fallbackLocales: string[]) {
  return isLocaleCacheable(locale) && fallbackLocales.every(fallbackLocale => isLocaleCacheable(fallbackLocale))
}

/**
 * Create a cache map for locales and fallback locales
 */
export function createLocaleCacheMap(opts: { getFallbackLocales: (locale: string) => string[] }) {
  const localeCacheMap = new Map<string, boolean>()
  for (const locale of Object.keys(localeCodes)) {
    localeCacheMap.set(locale, isLocaleCacheable(locale))
  }

  const localeChainCacheMap = new Map<string, boolean>()
  for (const locale of Object.keys(localeCodes)) {
    localeChainCacheMap.set(
      locale,
      localeCacheMap.get(locale)! && opts.getFallbackLocales(locale).every(fallback => isLocaleCacheable(fallback))
    )
  }

  return {
    localeCacheMap,
    localeChainCacheMap
  }
}

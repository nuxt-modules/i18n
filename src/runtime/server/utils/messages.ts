import { deepCopy } from '@intlify/shared'
import { cachedFunction } from 'nitropack/runtime'
import { localeLoaders } from '#internal/i18n/options.mjs'
import { getLocaleMessagesMerged } from '../../messages'

import type { LocaleMessages } from '@intlify/core'
import type { DefineLocaleMessage } from '@intlify/h3'

/**
 * Load messages for the specified locale
 */
const _getMessages = async (locale: string) => {
  return { [locale]: await getLocaleMessagesMerged(locale, localeLoaders[locale]) }
}

/**
 * Load messages for the specified locale (cached)
 */
const _getMessagesCached = cachedFunction(_getMessages, {
  name: 'i18n:loadMessages',
  maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
  getKey: locale => locale,
  shouldBypassCache: locale => !isLocaleCacheable(locale)
})

/**
 * Load messages for the specified locale in the shape of `{ [locale]: { ... } }`
 * - uses `_getMessages` in development
 * - uses `getMessagesCached` in production
 */
const getMessages = import.meta.dev ? _getMessages : _getMessagesCached

/**
 * Load messages for the specified locale and merge with fallback locales in the shape of `{ [locale]: { ... } }`
 * @param locale - The locale to load messages for
 * @param fallbackLocales - The fallback locales to merge with
 */
export const getMergedMessages = async (locale: string, fallbackLocales: string[]) => {
  const merged = {} as LocaleMessages<DefineLocaleMessage>

  try {
    if (fallbackLocales.length > 0) {
      const messages = await Promise.all(fallbackLocales.map(getMessages))
      for (const message of messages) {
        deepCopy(message, merged)
      }
    }

    const message = await getMessages(locale)
    deepCopy(message, merged)

    return merged
  } catch (e) {
    throw new Error('Failed to merge messages: ' + (e as Error).message)
  }
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

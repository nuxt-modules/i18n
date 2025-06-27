import { deepCopy } from '@intlify/shared'
import { localeLoaders } from '#internal/i18n-options.mjs'
import { getLocaleMessagesMerged } from '../../shared/messages'
import { cachedFunctionI18n } from './cache'
import { isLocaleCacheable, isLocaleWithFallbacksCacheable } from '../../shared/locales'

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
const _getMessagesCached = cachedFunctionI18n(_getMessages, {
  name: 'messages',
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

const _getMergedMessages = async (locale: string, fallbackLocales: string[]) => {
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
 * Load messages for the specified locale and merge with fallback locales in the shape of `{ [locale]: { ... } }`
 * @param locale - The locale to load messages for
 * @param fallbackLocales - The fallback locales to merge with
 */
export const getMergedMessages = cachedFunctionI18n(_getMergedMessages, {
  name: 'merged-single',
  maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
  getKey: (locale, fallbackLocales) => `${locale}-[${[...new Set(fallbackLocales)].sort().join('-')}]`,
  shouldBypassCache: (locale, fallbackLocales) => !isLocaleWithFallbacksCacheable(locale, fallbackLocales)
})

const _getAllMergedMessages = async (locales: string[]) => {
  const merged = {} as LocaleMessages<DefineLocaleMessage>

  try {
    const messages = await Promise.all(locales.map(getMessages))

    for (const message of messages) {
      deepCopy(message, merged)
    }

    return merged
  } catch (e) {
    throw new Error('Failed to merge messages: ' + (e as Error).message)
  }
}

export const getAllMergedMessages = cachedFunctionI18n(_getAllMergedMessages, {
  name: 'merged-all',
  maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
  getKey: locales => locales.join('-'),
  shouldBypassCache: locales => !locales.every(locale => isLocaleCacheable(locale))
})

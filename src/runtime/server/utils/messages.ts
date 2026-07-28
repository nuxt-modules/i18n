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
  shouldBypassCache: locale => !isLocaleCacheable(locale),
})

/**
 * Load messages for the specified locale in the shape of `{ [locale]: { ... } }`
 * - uses `_getMessages` in development
 * - uses `getMessagesCached` in production
 */
const getMessages = import.meta.dev ? _getMessages : _getMessagesCached

/** Backstop for the build-time scan (#3940), which cannot see a composable an imported helper calls */
function appContextHint(e: Error) {
  if (!/ is not defined|Nuxt instance unavailable/.test(e.message)) { return '' }
  return '. Locale loaders run outside the Nuxt app when the server produces messages, so Nuxt app '
    + 'composables (`useNuxtApp`, `useState`, `useCookie`, ...) are unavailable - call them in the '
    + 'locale file itself to have the build keep that locale in the app instead.'
}

const _getMergedMessages = async (locale: string, fallbackLocales: string[]) => {
  try {
    // with nothing to merge, copying would only duplicate the tree
    if (fallbackLocales.length === 0) {
      return (await getMessages(locale)) ?? {}
    }

    const merged = {} as LocaleMessages<DefineLocaleMessage>
    const messages = await Promise.all(fallbackLocales.map(getMessages))
    for (const message of messages) {
      deepCopy(message, merged)
    }

    deepCopy(await getMessages(locale), merged)

    return merged
  } catch (e) {
    throw new Error('Failed to merge messages: ' + (e as Error).message + appContextHint(e as Error), { cause: e })
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
  shouldBypassCache: (locale, fallbackLocales) => !isLocaleWithFallbacksCacheable(locale, fallbackLocales),
})

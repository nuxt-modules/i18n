import { deepCopy, isFunction, toTypeString } from '@intlify/shared'
import { useNuxtApp } from '#app'

import type { I18nOptions, Locale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { VueI18nConfig } from '#internal-i18n-types'

type MessageLoaderFunction<T = DefineLocaleMessage> = (locale: Locale) => Promise<LocaleMessages<T>>
type MessageLoaderResult<T, Result = MessageLoaderFunction<T> | LocaleMessages<T>> = { default: Result } | Result

type LocaleLoader<T = LocaleMessages<DefineLocaleMessage>> = {
  key: string
  cache: boolean
  load: () => Promise<MessageLoaderResult<T>>
}

const cacheMessages = new Map<string, { ttl: number; value: LocaleMessages<DefineLocaleMessage> }>()

export async function loadVueI18nOptions(vueI18nConfigs: VueI18nConfig[]): Promise<I18nOptions> {
  const nuxtApp = useNuxtApp()
  const vueI18nOptions: I18nOptions = { messages: {} }

  for (const configFile of vueI18nConfigs) {
    const resolver = await configFile().then(x => x.default)
    const resolved = isFunction(resolver) ? await nuxtApp.runWithContext(() => resolver()) : resolver
    deepCopy(resolved, vueI18nOptions)
  }

  vueI18nOptions.fallbackLocale ??= false
  return vueI18nOptions
}

/**
 * Check if the value is a module
 */
const isModule = (val: unknown): val is { default: unknown } => toTypeString(val) === '[object Module]'

/**
 * Check if the value is a module and handle edge case server-side
 */
const isResolvedModule = (val: unknown): val is { default: unknown } => isModule(val) || import.meta.server

/**
 * Get locale messages from loader
 */
async function getLocaleMessages(locale: string, loader: LocaleLoader) {
  const nuxtApp = useNuxtApp()
  try {
    const getter = await nuxtApp.runWithContext(loader.load).then(x => (isResolvedModule(x) ? x.default : x))
    return isFunction(getter) ? await nuxtApp.runWithContext(() => getter(locale)) : getter
  } catch (e: unknown) {
    throw new Error(`Failed loading locale (${locale}): ` + (e as Error).message)
  }
}

/**
 * Get locale messages from the loaders of a single locale and merge these
 */
export async function getLocaleMessagesMerged(locale: string, loaders: LocaleLoader[] = []) {
  const nuxtApp = useNuxtApp()
  const merged: LocaleMessages<DefineLocaleMessage> = {}
  for (const loader of loaders) {
    deepCopy(await nuxtApp.runWithContext(async () => await getLocaleMessages(locale, loader)), merged)
  }
  return merged
}

/**
 * Wraps the `getLocaleMessages` function to use cache
 */
export async function getLocaleMessagesMergedCached(locale: string, loaders: LocaleLoader[] = []) {
  const nuxtApp = useNuxtApp()
  const merged: LocaleMessages<DefineLocaleMessage> = {}

  for (const loader of loaders) {
    const cached = getCachedMessages(loader)
    const messages = cached || (await nuxtApp.runWithContext(async () => await getLocaleMessages(locale, loader)))

    if (!cached && loader.cache !== false) {
      cacheMessages.set(loader.key, { ttl: Date.now() + __I18N_CACHE_LIFETIME__ * 1000, value: messages })
    }

    deepCopy(messages, merged)
  }

  return merged
}

/**
 * Get cached message
 * - if cache has expired, returns undefined
 * - if `cacheTime` is set to 0, cache never expires
 */
function getCachedMessages(loader: LocaleLoader) {
  if (!__I18N_CACHE__) return
  if (loader.cache === false) return

  const cache = cacheMessages.get(loader.key)
  if (cache == null) return

  // if cacheTime is 0, always return cache
  return __I18N_CACHE_LIFETIME__ === 0 || cache.ttl > Date.now() ? cache.value : undefined
}

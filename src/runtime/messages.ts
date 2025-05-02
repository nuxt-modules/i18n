import { deepCopy, isArray, isFunction, isString, toTypeString } from '@intlify/shared'

import type { I18nOptions, Locale, FallbackLocale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { VueI18nConfig } from '#internal-i18n-types'

type MessageLoaderFunction<T = DefineLocaleMessage> = (locale: Locale) => Promise<LocaleMessages<T>>
type MessageLoaderResult<T, Result = MessageLoaderFunction<T> | LocaleMessages<T>> = { default: Result } | Result

type LocaleLoader<T = LocaleMessages<DefineLocaleMessage>> = {
  key: string
  cache: boolean
  load: () => Promise<MessageLoaderResult<T>>
}

// mock nuxt.runWithContext to have identical signature in nitro context (which does not need runWithContext)
const nuxtMock: { runWithContext: NuxtApp['runWithContext'] } = {
  runWithContext: async (fn: () => Promise<never>) => await fn()
}
const cacheMessages = new Map<string, { time: number; message: LocaleMessages<DefineLocaleMessage> }>()

export async function loadVueI18nOptions(vueI18nConfigs: VueI18nConfig[], nuxt = nuxtMock): Promise<I18nOptions> {
  const vueI18nOptions: I18nOptions = { messages: {} }
  for (const configFile of vueI18nConfigs) {
    const { default: resolver } = await configFile()

    const resolved = isFunction(resolver) ? await nuxt.runWithContext(() => resolver()) : resolver

    deepCopy(resolved, vueI18nOptions)
  }

  vueI18nOptions.fallbackLocale ??= false

  return vueI18nOptions
}

export function makeFallbackLocaleCodes(fallback: FallbackLocale, locales: Locale[]): Locale[] {
  if (fallback === false) return []
  if (isArray(fallback)) return fallback

  let fallbackLocales: Locale[] = []
  if (isString(fallback)) {
    if (locales.every(locale => locale !== fallback)) {
      fallbackLocales.push(fallback)
    }
    return fallbackLocales
  }

  const targets = [...locales, 'default']
  for (const locale of targets) {
    if (locale in fallback == false) continue
    fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)]
  }

  return fallbackLocales
}

/**
 * Check if the value is a module
 */
const isModule = (val: unknown): val is { default: unknown } => toTypeString(val) === '[object Module]'

/**
 * Check if the value is a module and handle edge case server-side
 */
const isResolvedModule = (val: unknown): val is { default: unknown } =>
  (__LAZY_LOCALES__ && import.meta.server) || isModule(val)

/**
 * Get locale messages from loader
 */
export async function getLocaleMessages(locale: string, loader: LocaleLoader) {
  try {
    const getter = await loader.load().then(x => (isResolvedModule(x) ? x.default : x))
    return isFunction(getter) ? await getter(locale) : getter
  } catch (e: unknown) {
    throw new Error(`Failed loading locale (${locale}): ` + (e as Error).message)
  }
}

/**
 * Get locale messages from loader and merge them
 */
export async function getLocaleMessagesMerged(locale: string, loaders: LocaleLoader[] = []) {
  const merged: LocaleMessages<DefineLocaleMessage> = {}
  for (const loader of loaders) {
    deepCopy(await getLocaleMessages(locale, loader), merged)
  }
  return merged
}

/**
 * Get locale messages from loader and cache them
 */
async function getLocaleMessagesCached(locale: string, loader: LocaleLoader) {
  let message: LocaleMessages<DefineLocaleMessage> = {}

  const cached = __I18N_CACHE__ && !import.meta.dev && loader.cache && getCachedMessages(loader.key)
  const usedCache = !!cached

  message = cached || (await getLocaleMessages(locale, loader))
  if (__I18N_CACHE__ && !usedCache && loader.cache && !import.meta.dev) {
    cacheMessages.set(loader.key, { time: Date.now() + __I18N_CACHE_LIFETIME__ * 1000, message })
  }

  return message
}

/**
 * Wraps the `getLocaleMessages` function to use cache
 */
export async function getLocaleMessagesMergedCached(locale: string, loaders: LocaleLoader[] = []) {
  const merged: LocaleMessages<DefineLocaleMessage> = {}
  for (const loader of loaders) {
    deepCopy(await getLocaleMessagesCached(locale, loader), merged)
  }
  return merged
}

/**
 * Get cached message
 * - if cache has expired, returns undefined
 * - if `cacheTime` is set to 0, cache never expires
 */
function getCachedMessages(key: string) {
  const cache = cacheMessages.get(key)
  if (cache == null) return
  // if cacheTime is 0, always return cache
  const fresh = __I18N_CACHE_LIFETIME__ === 0 || cache.time > Date.now()
  return fresh ? cache.message : undefined
}

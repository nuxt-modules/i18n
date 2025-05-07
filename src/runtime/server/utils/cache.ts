import { useStorage } from 'nitropack/runtime'
import { prefixStorage } from 'unstorage'
import { localeLoaders } from '#internal/i18n/options.mjs'

export interface CacheOptions<T = any, ArgsT extends unknown[] = any[]> {
  name?: string
  getKey: (...args: ArgsT) => string
  shouldBypassCache: (...args: ArgsT) => boolean
  group?: string
  /**
   * Number of seconds to cache the response. Defaults to 1.
   */
  maxAge?: number
}

const storage = prefixStorage(useStorage(), 'i18n')
type CachedValue<T> = { ttl: number; value: T; mtime: number }

/**
 * Create a cached function
 * Adapted from nitropack/runtime `cachedFunction`
 */
export function cachedFunctionI18n<T, ArgsT extends unknown[] = any[]>(
  fn: (...args: ArgsT) => T | Promise<T>,
  opts: CacheOptions<T, ArgsT>
): (...args: ArgsT) => Promise<T> {
  opts = { maxAge: 1, ...opts }
  const pending: { [key: string]: Promise<T> } = {}

  async function get(key: string, resolver: () => T | Promise<T>) {
    const isPending = pending[key]

    if (!isPending) {
      pending[key] = Promise.resolve(resolver())
    }

    const result = await pending[key]
    delete pending[key]
    return result
  }

  return async (...args) => {
    const key = [opts.name, opts.getKey(...args)].join(':').replace(/:\/$/, ':index')
    const maxAge = opts.maxAge ?? 1
    const isCacheable = !opts.shouldBypassCache(...args) && maxAge >= 0

    const cache = isCacheable && (await storage.getItemRaw<CachedValue<T>>(key))
    if (!cache || cache.ttl < Date.now()) {
      pending[key] = Promise.resolve(fn(...args))
      const value = await get(key, () => fn(...args))

      if (isCacheable) {
        await storage.setItemRaw(key, { ttl: Date.now() + maxAge * 1000, value, mtime: Date.now() })
      }

      return value
    }

    return cache.value
  }
}

/**
 * Check if the loaders for the specified locale are all cacheable
 */
export function isLocaleCacheable(locale: string) {
  return localeLoaders[locale] != null && localeLoaders[locale].every(loader => loader.cache !== false)
}

/**
 * Check if the loaders for the specified locale and fallback locales are all cacheable
 */
export function isLocaleWithFallbacksCacheable(locale: string, fallbackLocales: string[]) {
  return isLocaleCacheable(locale) && fallbackLocales.every(fallbackLocale => isLocaleCacheable(fallbackLocale))
}

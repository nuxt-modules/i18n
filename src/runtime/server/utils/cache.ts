/* eslint-disable @typescript-eslint/no-explicit-any */
import { useStorage } from '#internal/i18n-nitro.mjs'
import { prefixStorage } from 'unstorage'

export interface CacheOptions<ArgsT extends unknown[] = any[]> {
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
type CachedValue<T> = { ttl: number, value: T, mtime: number }

/**
 * Cached values are served by reference to every request, so freezing turns a stray mutation into
 * an error instead of cross-request pollution. Functions are skipped - vue-i18n stamps `locale`
 * and `key` onto message functions.
 */
function deepFreeze<T>(value: T): T {
  if (value == null || typeof value !== 'object' || Object.isFrozen(value)) { return value }
  for (const key of Object.keys(value)) {
    deepFreeze((value as Record<string, unknown>)[key])
  }
  return Object.freeze(value)
}

/**
 * Create a cached function
 * Adapted from nitropack/runtime `cachedFunction`
 */
export function cachedFunctionI18n<T, ArgsT extends unknown[] = any[]>(
  fn: (...args: ArgsT) => T | Promise<T>,
  opts: CacheOptions<ArgsT>,
): (...args: ArgsT) => Promise<T | undefined> {
  opts = { maxAge: 1, ...opts }
  const pending: { [key: string]: Promise<T> } = {}

  async function get(key: string, resolver: () => T | Promise<T>) {
    const isPending = pending[key]

    if (!isPending) {
      pending[key] = Promise.resolve(resolver())
    }

    try {
      return await pending[key]
    } finally {
      // Ensure we always clean up, whether the promise resolved or rejected.
      delete pending[key]
    }
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
        // the first caller receives the stored object itself, so freeze covers both
        deepFreeze(value)
        await storage.setItemRaw(key, { ttl: Date.now() + maxAge * 1000, value, mtime: Date.now() })
      }

      return value
    }

    return cache.value
  }
}

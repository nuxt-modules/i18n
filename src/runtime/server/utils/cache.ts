import { useStorage } from 'nitropack/runtime'
import { prefixStorage } from 'unstorage'

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

    try {
      return await pending[key]
    } finally {
      // Ensure we always clean up, whether the promise resolved or rejected.
      delete pending[key]
    }
  }

  // @ts-expect-error needs to be properly typed
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

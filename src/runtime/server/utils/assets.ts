import { useStorage } from '#internal/i18n-nitro.mjs'

import type { DefineLocaleMessage, LocaleMessages } from 'vue-i18n'

// asset content is immutable per deploy - parse each asset once and share the result,
// consumers deep-copy out of loader results so the shared object is never mutated
const parsed = new Map<string, Promise<LocaleMessages<DefineLocaleMessage>>>()

export function readI18nAsset(key: string) {
  if (!parsed.has(key)) {
    // `getItemRaw` - `getItem` re-parses (`destr`) the full raw string on every call
    const promise = useStorage('assets/i18n').getItemRaw(key).then((raw) => {
      if (raw == null) {
        throw new Error(`Missing messages asset '${key}' - the server build may be stale, try rebuilding.`)
      }
      return JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw))
    })
    parsed.set(key, promise)
    // never memoize failures - transient read errors (e.g. during prerender) should retry
    promise.catch(() => parsed.delete(key))
  }
  return parsed.get(key)!
}

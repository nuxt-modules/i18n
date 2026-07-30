import { useStorage } from 'nitropack/runtime'

import type { DefineLocaleMessage, LocaleMessages } from 'vue-i18n'

// asset content is immutable per deploy - parse each asset once and share the result,
// consumers deep-copy out of loader results so the shared object is never mutated
const parsed = new Map<string, Promise<LocaleMessages<DefineLocaleMessage>>>()

/** Reads an asset emitted into the server output - nitro rewrites `import.meta.url` to its entry */
function readAssetFile(key: string): Promise<string> {
  return import('node:fs/promises').then(fs => fs.readFile(new URL(`./i18n-assets/${key}`, import.meta.url), 'utf-8'))
}

/** Reads an asset embedded in the server bundle, the only option on targets without a filesystem */
function readAssetStorage(key: string): Promise<string | Uint8Array | null> {
  // `getItemRaw` - `getItem` re-parses (`destr`) the full raw string on every call
  return useStorage('assets/i18n').getItemRaw(key)
}

function readAsset(key: string) {
  return __I18N_FS_ASSETS__ ? readAssetFile(key) : readAssetStorage(key)
}

export function readI18nAsset(key: string) {
  if (!parsed.has(key)) {
    const promise = readAsset(key).then((raw) => {
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

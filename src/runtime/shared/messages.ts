import { assign, create, deepCopy, isFunction, toTypeString } from '@intlify/shared'
import { useNuxtApp } from '#app'
import { createDefu } from 'defu'

import type { DefineLocaleMessage, I18nOptions, Locale, LocaleMessages } from 'vue-i18n'
import type { VueI18nConfig } from '#internal-i18n-types'

type MessageLoaderFunction<T = DefineLocaleMessage> = (locale: Locale) => Promise<LocaleMessages<T>>
type MessageLoaderResult<T, Result = MessageLoaderFunction<T> | LocaleMessages<T>> = { default: Result } | Result

type LocaleLoader<T = LocaleMessages<DefineLocaleMessage>> = {
  key: string
  cache: boolean
  load: () => Promise<MessageLoaderResult<T>>
}

const cacheMessages = new Map<string, { ttl: number, value: LocaleMessages<DefineLocaleMessage> }>()

/**
 * Clone a message tree. Unlike `@intlify/shared`'s `deepCopy` this copies arrays instead of
 * sharing them; message functions are shared, vue-i18n treats them as opaque values.
 */
export function cloneDeep<T>(value: T): T {
  if (value == null || typeof value !== 'object') { return value }
  if (Array.isArray(value)) { return value.map(cloneDeep) as T }
  const out = create(null) as Record<string, unknown>
  for (const key of Object.keys(value)) {
    out[key] = cloneDeep((value as Record<string, unknown>)[key])
  }
  return out as T
}

/** Whether a message tree holds a function anywhere - JSON delivery drops these silently */
export function hasMessageFunction(value: unknown, seen = new WeakSet<object>()): boolean {
  if (isFunction(value)) { return true }
  if (value == null || typeof value !== 'object') { return false }
  // a loader is free to return a tree that references itself, and this runs while prerendering
  if (seen.has(value)) { return false }
  seen.add(value)
  return Object.values(value).some(x => hasMessageFunction(x, seen))
}

/**
 * Backstop for the build-time scan (#3880): warns when a locale it classified as serializable turns
 * out to hold functions after all. Callers gate this to dev/prerender, walking every tree is not free.
 */
export function warnMissedMessageFunctions(locale: string, messages: unknown) {
  // assigned before use: this module is also compiled by nitro, whose `replace` leaves
  // identifiers alone when they are immediately followed by `.`
  const unserializable: string[] = __I18N_UNSERIALIZABLE_LOCALES__
  if (unserializable.includes(locale) || !hasMessageFunction(messages)) { return }
  console.warn(
    `[nuxt-i18n] Messages for locale "${locale}" contain message functions the build did not detect - they are dropped when messages are delivered as JSON. Write message functions literally in a locale file to make them detectable.`,
  )
}

const isTree = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value)

/**
 * Returns a tree where `base` fills the gaps in `over`, sharing every subtree `base` does not reach.
 * Equivalent to merging `over` into a copy of `base`, but the copying is proportional to `base` -
 * where `mergeLocaleMessage` deep copies proportional to `over`, which is the whole point.
 */
export function fillMissing<T>(over: T, base: unknown): T {
  return isTree(over) && isTree(base) ? (fillTree(over, base) as T) : over
}

function fillTree(over: Record<string, unknown>, base: Record<string, unknown>) {
  let out = over
  for (const key of Object.keys(base)) {
    // `in` would match `toString` and friends on a tree that JSON.parse gave a prototype
    const has = Object.hasOwn(over, key)
    const current = over[key]
    const filled = !has
      ? base[key]
      : isTree(current) && isTree(base[key]) ? fillTree(current, base[key]) : current

    if (has && filled === current) { continue }
    if (out === over) { out = assign(create(null), over) }
    out[key] = filled
  }

  return out
}

const merger = createDefu((obj, key, value) => {
  if (key === 'messages' || key === 'datetimeFormats' || key === 'numberFormats') {
    // @ts-expect-error generic object
    obj[key] ??= create(null)
    deepCopy(value, obj[key])
    return true
  }
})

export async function loadVueI18nOptions(vueI18nConfigs: VueI18nConfig[]): Promise<I18nOptions> {
  const nuxtApp = useNuxtApp()
  let vueI18nOptions: I18nOptions = { messages: create(null) as LocaleMessages<DefineLocaleMessage> }

  for (const configFile of vueI18nConfigs) {
    const resolver = await configFile().then(x => (isModule(x) ? x.default : x))
    const resolved = isFunction(resolver) ? await nuxtApp.runWithContext(() => resolver()) : resolver
    vueI18nOptions = merger(create(null), resolved, vueI18nOptions)
  }

  vueI18nOptions.fallbackLocale ??= false
  return vueI18nOptions
}

/**
 * Check if the value is a module
 */
const isModule = (val: unknown): val is { default: unknown } => toTypeString(val) === '[object Module]'

/**
 * Get locale messages from loader
 */
async function getLocaleMessages(locale: string, loader: LocaleLoader) {
  const nuxtApp = useNuxtApp()
  try {
    const getter = await nuxtApp.runWithContext(loader.load).then(x => (isModule(x) ? x.default : x))
    return isFunction(getter) ? await nuxtApp.runWithContext(() => getter(locale)) : getter
  } catch (e: unknown) {
    throw new Error(`Failed loading locale (${locale}): ` + (e as Error).message, { cause: e })
  }
}

/**
 * Get locale messages from the loaders of a single locale and merge these
 */
export async function getLocaleMessagesMerged(locale: string, loaders: LocaleLoader[] = []) {
  const nuxtApp = useNuxtApp()
  const messages = await Promise.all(
    loaders.map(loader => nuxtApp.runWithContext(() => getLocaleMessages(locale, loader))),
  )

  const merged: LocaleMessages<DefineLocaleMessage> = {}
  for (const message of messages) {
    deepCopy(message, merged)
  }

  return merged
}

/**
 * Wraps the `getLocaleMessages` function to use cache
 */
export async function getLocaleMessagesMergedCached(locale: string, loaders: LocaleLoader[] = []) {
  const nuxtApp = useNuxtApp()
  const messages = await Promise.all(loaders.map(async (loader) => {
    const cached = getCachedMessages(loader)
    const messages = cached || (await nuxtApp.runWithContext(() => getLocaleMessages(locale, loader)))

    if (!cached && loader.cache !== false) {
      cacheMessages.set(loader.key, { ttl: Date.now() + __I18N_CACHE_LIFETIME__ * 1000, value: messages })
    }

    return messages
  }))

  const merged: LocaleMessages<DefineLocaleMessage> = {}
  for (const message of messages) {
    deepCopy(message, merged)
  }

  return merged
}

/**
 * Get cached message
 * - if cache has expired, returns undefined
 * - if `cacheTime` is set to 0, cache never expires
 */
function getCachedMessages(loader: LocaleLoader) {
  if (!__I18N_CACHE__) { return }
  if (loader.cache === false) { return }

  const cache = cacheMessages.get(loader.key)
  if (cache == null) { return }

  // if cacheTime is 0, always return cache
  return __I18N_CACHE_LIFETIME__ === 0 || cache.ttl > Date.now() ? cache.value : undefined
}

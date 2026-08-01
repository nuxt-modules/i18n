import { localeCodes, localeLoaders, normalizedLocales } from '#build/i18n-options.mjs'
import { isArray, isString } from '@intlify/shared'
import { normalizeDomain } from './domain'
import type { FallbackLocale } from 'vue-i18n'
import type { NormalizedLocaleObject } from '#internal-i18n-types'

type LocaleConfig = { cacheable: boolean, fallbacks: string[] }
export function createLocaleConfigs(fallbackLocale: FallbackLocale): Record<string, LocaleConfig> {
  const localeConfigs: Record<string, LocaleConfig> = {}

  for (const locale of localeCodes) {
    const fallbacks = getFallbackLocaleCodes(fallbackLocale, [locale])
    const cacheable = isLocaleWithFallbacksCacheable(locale, fallbacks)
    localeConfigs[locale] = { fallbacks, cacheable }
  }

  return localeConfigs
}

function getFallbackLocaleCodes(fallback: FallbackLocale, locales: string[]): string[] {
  if (fallback === false) { return [] }
  if (isArray(fallback)) { return fallback }

  let fallbackLocales: string[] = []
  if (isString(fallback)) {
    if (locales.every(locale => locale !== fallback)) {
      fallbackLocales.push(fallback)
    }
    return fallbackLocales
  }

  const targets = [...locales, 'default']
  for (const locale of targets) {
    if (locale in fallback == false) { continue }
    fallbackLocales = [...fallbackLocales, ...fallback[locale]!.filter(Boolean)]
  }

  return fallbackLocales
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

/**
 * The locale configured as the default for `host`, undefined when no locale claims it
 */
export function getDefaultLocaleForDomain(host: string, locales: NormalizedLocaleObject[] = normalizedLocales): string | undefined {
  return locales.find(l => l.defaultForDomains.some(domain => normalizeDomain(domain) === host))?.code
}

/**
 * The unprefixed locale for `host`: the locale that domain is the default for, falling back to the
 * configured `defaultLocale` where the host claims none. Route generation, the routing context and
 * the server all have to agree on this, so they resolve it here rather than each deriving it.
 */
export function resolveDefaultLocale(
  host: string,
  defaultLocale: string | undefined,
  locales: NormalizedLocaleObject[] = normalizedLocales,
): string {
  const resolved = getDefaultLocaleForDomain(host, locales) || defaultLocale
  if (resolved) { return resolved }

  // under domains `defaultLocale` is optional, so a host claiming none of them can end up with no
  // unprefixed locale at all - the route table then has nothing at `/` and every unprefixed path
  // 404s. Serving the first locale there keeps such a host (dev, staging, a health check by IP)
  // usable, matching the promise that every locale is served on it
  return (locales.some(l => l.domains.length) ? locales[0]?.code : '') || ''
}

/**
 * The locales in effect for the current request: the runtime config list (which an
 * `i18n:request-config` nitro hook may have narrowed per request) resolved against the built
 * locales. A code the build does not know is dropped - it has no routes, messages or loaders.
 */
export function resolveEffectiveLocales(
  runtimeLocales: string[] | NormalizedLocaleObject[],
): NormalizedLocaleObject[] {
  const effective: NormalizedLocaleObject[] = []
  for (const locale of runtimeLocales) {
    const code = isString(locale) ? locale : locale.code
    const built = normalizedLocales.find(l => l.code === code)
    if (!built) {
      import.meta.dev && console.warn(`[nuxt-i18n] Ignoring locale "${code}" - it is not part of the build`)
      continue
    }
    effective.push(isString(locale) ? built : locale)
  }
  return effective
}

export const isSupportedLocale = (locale?: string): boolean => localeCodes.includes(locale || '')

export const resolveSupportedLocale = (locale: string | undefined) => (isSupportedLocale(locale) ? locale : undefined)

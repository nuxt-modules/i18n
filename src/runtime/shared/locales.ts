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
  return getDefaultLocaleForDomain(host, locales) || defaultLocale || ''
}

export const isSupportedLocale = (locale?: string): boolean => localeCodes.includes(locale || '')

export const resolveSupportedLocale = (locale: string | undefined) => (isSupportedLocale(locale) ? locale : undefined)

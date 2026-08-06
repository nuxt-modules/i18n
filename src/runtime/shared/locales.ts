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

/**
 * When a key is missing on a region-tagged locale like `en-US`, vue-i18n automatically tries its
 * base tag `en` before it even looks at `fallbackLocale`. That only works if `en`'s messages are
 * actually loaded though, so we add the base tag here when it's also a configured locale. If it
 * isn't configured, there's no file to load for it anyway, so we leave it alone rather than
 * fetching something the user never defined.
 */
const localeCodeSet = new Set(localeCodes)

function configuredBaseTags(locale: string): string[] {
  const tags: string[] = []
  let tag = locale
  while (tag.includes('-')) {
    tag = tag.slice(0, tag.lastIndexOf('-'))
    if (localeCodeSet.has(tag)) { tags.push(tag) }
  }
  return tags
}

export function getFallbackLocaleCodes(fallback: FallbackLocale, locales: string[]): string[] {
  const baseTags = locales.flatMap(configuredBaseTags).filter(tag => !locales.includes(tag))

  if (fallback === false) { return baseTags }
  if (isArray(fallback)) { return [...baseTags, ...fallback] }

  const fallbackLocales: string[] = [...baseTags]
  if (isString(fallback)) {
    if (locales.every(locale => locale !== fallback)) {
      fallbackLocales.push(fallback)
    }
    return fallbackLocales
  }

  const targets = [...locales, 'default']
  for (const locale of targets) {
    if (locale in fallback == false) { continue }
    fallbackLocales.push(...fallback[locale]!.filter(Boolean))
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

export const isSupportedLocale = (locale?: string): boolean => localeCodes.includes(locale || '')

export const resolveSupportedLocale = (locale: string | undefined) => (isSupportedLocale(locale) ? locale : undefined)

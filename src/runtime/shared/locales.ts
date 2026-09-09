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

const localeCodeSet = new Set(localeCodes)

/**
 * What a fallback map entry redirects a walk to when it names `tag` exactly, or false when there's
 * nothing configured for it.
 */
function redirectFor(tag: string, fallback: FallbackLocale): string[] | false {
  if (fallback === false || isString(fallback) || isArray(fallback)) { return false }
  const targets = fallback[tag]
  return isArray(targets) ? targets.filter(Boolean) : false
}

/**
 * What vue-i18n tries once a locale's own chain runs out: the whole `fallbackLocale` value when
 * it's a string or array, or its `default` entry when it's a map.
 */
function defaultTargets(fallback: FallbackLocale): string[] | false {
  if (fallback === false) { return false }
  if (isString(fallback)) { return [fallback] }
  if (isArray(fallback)) { return fallback }
  return isArray(fallback.default) ? fallback.default.filter(Boolean) : false
}

/**
 * Walks one locale tag from its full form down to its base tag, recording every tag it passes
 * through into `chain`. Stops early when the tag ends in `!`, vue-i18n's own way of suppressing
 * further fallback for that tag, or when `fallbackLocale` names this exact tag, in which case the
 * walk redirects to whatever that entry configures instead of continuing to strip the tag down.
 */
function walkLocale(chain: Map<string, boolean>, locale: string, fallback: FallbackLocale): string[] | false {
  const stopHere = locale.endsWith('!')
  let tag = stopHere ? locale.slice(0, -1) : locale
  let explicit = true

  while (true) {
    const alreadyWalked = chain.has(tag)
    // a tag can be reached implicitly first and only later turn out to be named explicitly, or
    // the other way round, so once it's explicit we keep it that way
    chain.set(tag, explicit || (chain.get(tag) ?? false))
    // a tag that's already been walked doesn't get walked or redirected again. This is also what
    // stops a fallback map with a cycle in it, like `{en: ['fr'], fr: ['en']}`, from looping forever
    if (alreadyWalked) { return false }

    const redirect = redirectFor(tag, fallback)
    if (redirect) { return redirect }
    if (stopHere || !tag.includes('-')) { return false }

    tag = tag.slice(0, tag.lastIndexOf('-'))
    explicit = false
  }
}

/**
 * Walks a list of locale tags left to right, abandoning the rest of the list the moment one of
 * them redirects the walk elsewhere, matching how vue-i18n resolves a fallback block.
 */
function walkBlock(chain: Map<string, boolean>, block: string[], fallback: FallbackLocale): string[] | false {
  for (const locale of block) {
    const redirect = walkLocale(chain, locale, fallback)
    if (redirect) { return redirect }
  }
  return false
}

/**
 * Every tag vue-i18n's own fallback resolution would reach for `locale`, mapped to whether it was
 * named directly in `fallbackLocale` rather than only reached by stripping a region off some other
 * tag. Mirrors vue-i18n's own chain building (`fallbackWithLocaleChain` in @intlify/core-base)
 * closely enough to answer that question, without taking a runtime dependency on that undocumented
 * internal.
 */
function walkFallbackChain(locale: string, fallback: FallbackLocale): Map<string, boolean> {
  const chain = new Map<string, boolean>()

  let block: string[] | false = [locale]
  while (isArray(block)) {
    block = walkBlock(chain, block, fallback)
  }

  const targets = defaultTargets(fallback)
  if (targets) {
    // the default block can't be redirected by another map key, though its own entries still
    // get base-tag-walked and still honor a trailing `!`
    walkBlock(chain, targets, false)
  }

  return chain
}

export function getFallbackLocaleCodes(fallback: FallbackLocale, locales: string[]): string[] {
  // a Map already keeps insertion order and doesn't reorder on a repeated set of the same key, so
  // it doubles as the ordered list of tags reached, no separate array needed alongside it
  const explicitByTag = new Map<string, boolean>()
  // a trailing `!` works the same on a source locale as on any fallbackLocale entry, so compare
  // against the stripped form here too, or a source locale written that way would never match its
  // own (stripped) tag and end up listed as a fallback for itself
  const primaryTags = new Set(locales.map(locale => (locale.endsWith('!') ? locale.slice(0, -1) : locale)))

  for (const locale of locales) {
    for (const [tag, explicit] of walkFallbackChain(locale, fallback)) {
      if (primaryTags.has(tag)) { continue } // a primary locale, loaded separately by the caller
      explicitByTag.set(tag, explicit || (explicitByTag.get(tag) ?? false))
    }
  }

  // a tag named directly somewhere in fallbackLocale is kept even if it isn't itself a configured
  // locale, matching the old behavior of never filtering explicit entries. A tag only reached
  // implicitly, by stripping a region off some other tag, only gets kept when it's configured,
  // there's no file to load for a base tag nobody defined
  return [...explicitByTag].filter(([tag, explicit]) => explicit || localeCodeSet.has(tag)).map(([tag]) => tag)
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

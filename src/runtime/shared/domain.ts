import { hasProtocol } from 'ufo'
import { normalizedLocales } from '#build/i18n-options.mjs'

import type { I18nPublicRuntimeConfig, NormalizedLocaleObject } from '#internal-i18n-types'

/**
 * Configured domains may include a protocol (used when generating URLs), comparisons
 * against the request host use the host part only. `ufo` helpers are unsuitable here
 * as they treat the `host:port` shape as a protocol.
 */
export const normalizeDomain = (domain: string = '') => domain.replace(/^https?:\/\//i, '').toLowerCase()

/**
 * Whether the locale is served on the given host
 */
export function isLocaleOnHost(locale: NormalizedLocaleObject | undefined, host: string): boolean {
  return !!locale?.domains.some(x => normalizeDomain(x) === host)
}

/**
 * Whether the locale can be served on the given host. Unlike {@link isLocaleOnHost} a locale
 * configured without domains qualifies, as does any locale on a host configured for none of
 * them (a staging domain, a health check by IP) so the site keeps working there.
 */
export function isLocaleServedOnHost(locales: NormalizedLocaleObject[], host: string, locale: string): boolean {
  const target = locales.find(l => l.code === locale)
  if (!target?.domains.length) { return true }
  return isLocaleOnHost(target, host) || !locales.some(l => isLocaleOnHost(l, host))
}

/**
 * The domain canonically naming `locale`. `defaultForDomains` leads so the domain agrees with the
 * unprefixed shape callers derive from that same field.
 */
export const canonicalDomain = (target: NormalizedLocaleObject | undefined) =>
  target?.defaultForDomains[0] || target?.domain || target?.domains[0]

/**
 * The domain that should serve `locale` when `host` does not. Undefined when the current host
 * can serve it, which keeps hosts that match no configured domain on relative URLs instead of
 * sending them to a configured domain.
 */
function relocateHostForLocale(host: string, locale: string, locales: NormalizedLocaleObject[]): string | undefined {
  if (isLocaleServedOnHost(locales, host, locale)) { return }

  return canonicalDomain(locales.find(l => l.code === locale))
}

export function matchDomainLocale(
  locales: NormalizedLocaleObject[],
  host: string,
  pathLocale: string,
): string | undefined {
  const matches = locales.filter(locale => isLocaleOnHost(locale, host))

  return (
    // match by current path locale
    matches.find(l => l.code === pathLocale)
    // fallback to default locale for the domain
    || matches.find(l => l.defaultForDomains.some(domain => normalizeDomain(domain) === host))
    // a host claiming no default still resolves one of its own locales, never one served elsewhere
    || matches[0]
  )?.code
}

/**
 * Whether a cookie scoped to `cookieDomain` reaches every configured domain, i.e. each domain
 * equals the scope or is a subdomain of it. Ports are irrelevant to cookies.
 */
export function cookieSpansDomains(locales: NormalizedLocaleObject[], cookieDomain: string): boolean {
  const scope = cookieDomain.replace(/^\./, '').replace(/:\d+$/, '').toLowerCase()
  return locales.every(l =>
    l.domains.concat(l.domain || []).every((domain) => {
      const host = normalizeDomain(domain).replace(/:\d+$/, '')
      return host === scope || host.endsWith('.' + scope)
    }),
  )
}

const withProtocol = (domain: string, url: { protocol: string }) =>
  hasProtocol(domain, { strict: true }) ? domain : url.protocol + '//' + domain

export function domainFromLocale(
  domainLocales: Record<string, { domain: string | undefined }>,
  url: { host: string, protocol: string },
  locale: string,
  locales: NormalizedLocaleObject[] = normalizedLocales,
): string | undefined {
  const lang = locales.find(x => x.code === locale)
  // lookup the `differentDomain` origin associated with given locale
  const domain
    = domainLocales?.[locale]?.domain
      || lang?.domain
      || lang?.domains.find(v => normalizeDomain(v) === url.host)
      || relocateHostForLocale(url.host, locale, locales)

  if (!domain) {
    import.meta.dev && console.warn('[nuxt-i18n] Could not find domain name for locale ' + locale)
    return
  }

  return withProtocol(domain, url)
}

/**
 * Resolves {@link canonicalDomain} for `locale`, unlike {@link domainFromLocale} without a
 * current-host preference: alternate links must name one URL for a locale served on several
 * domains, identical from every host in the cluster, or the hreflang set is non-reciprocal.
 * Undefined for a locale configuring no domain, which is served on all of them - callers resolve
 * the cluster's own domain by asking for `defaultLocale` instead.
 */
export function canonicalDomainFromLocale(
  domainLocales: Record<string, { domain: string | undefined }>,
  url: { host: string, protocol: string },
  locale: string,
  locales: NormalizedLocaleObject[] = normalizedLocales,
): string | undefined {
  const domain = domainLocales?.[locale]?.domain || canonicalDomain(locales.find(x => x.code === locale))
  return domain ? withProtocol(domain, url) : undefined
}

/**
 * The configured domain matching the request host, keeping the protocol it was configured with.
 * This answers "where am I", unlike {@link domainFromLocale} which answers "where is this locale
 * served" and may resolve to another domain - deriving the current origin from a locale sends
 * hosts that serve no default locale to whichever domain `defaultLocale` happens to live on.
 */
export function domainForHost(
  domainLocales: I18nPublicRuntimeConfig['domainLocales'],
  url: { host: string, protocol: string },
  locales: NormalizedLocaleObject[] = normalizedLocales,
): string | undefined {
  let match: string | undefined
  for (const locale of locales) {
    const patched = withRuntimeDomain(locale, domainLocales)
    // a locale configuring both keeps `domain` outside `domains`, `domainFromLocale` reads it too
    for (const candidate of [patched.domain, ...patched.domains]) {
      if (!candidate || normalizeDomain(candidate) !== url.host) { continue }
      // locales sharing a host may not all configure it with a protocol, take the first match but
      // let one carrying a protocol replace it so `https` is not lost to configuration order
      if (!match || (!hasProtocol(match, { strict: true }) && hasProtocol(candidate, { strict: true }))) {
        match = candidate
      }
    }
  }

  return match && withProtocol(match, url)
}

/**
 * Returns the locale object with the domain overridden by `domainLocales` runtime config (see also `getHostLocale`),
 * a no-op outside domain setups since the override entries are empty.
 */
export function withRuntimeDomain<T extends string | NormalizedLocaleObject>(
  locale: T,
  domainLocales: I18nPublicRuntimeConfig['domainLocales'],
): T {
  if (typeof locale === 'string') {
    return locale
  }
  const properties = locale as NormalizedLocaleObject
  const domain = domainLocales[properties.code]?.domain
  // `domainLocales` is seeded from the configured scalar `domain`, an entry matching it is not an
  // override - rebuilding on it would drop the locale's other domains
  if (!domain || domain === properties.domain) {
    return locale
  }

  // the override is a single domain, leaving the build time `domains` in place would keep the
  // locale matching the host it was configured with as well as the one it was moved to
  return {
    ...properties,
    domain,
    domains: [domain],
    defaultForDomains: properties.defaultForDomains.length ? [domain] : [],
  } as T
}

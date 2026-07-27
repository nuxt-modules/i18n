import { hasProtocol } from 'ufo'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { toArray } from './utils'

import type { I18nPublicRuntimeConfig, LocaleObject } from '#internal-i18n-types'

/**
 * Configured domains may include a protocol (used when generating URLs), comparisons
 * against the request host use the host part only. `ufo` helpers are unsuitable here
 * as they treat the `host:port` shape as a protocol.
 */
export const normalizeDomain = (domain: string = '') => domain.replace(/^https?:\/\//i, '').toLowerCase()

/**
 * Whether the locale is served on the given host
 */
export function isLocaleOnHost(locale: LocaleObject | undefined, host: string): boolean {
  return (
    !!locale && (normalizeDomain(locale.domain) === host || toArray(locale.domains).some(x => normalizeDomain(x) === host))
  )
}

/**
 * Whether the locale can be served on the given host. Unlike {@link isLocaleOnHost} a locale
 * configured without domains qualifies, as does any locale on a host configured for none of
 * them (a staging domain, a health check by IP) so the site keeps working there.
 */
export function isLocaleServedOnHost(locales: LocaleObject[], host: string, locale: string): boolean {
  const target = locales.find(l => l.code === locale)
  if (!target?.domain && !target?.domains?.length) { return true }
  return isLocaleOnHost(target, host) || !locales.some(l => isLocaleOnHost(l, host))
}

/**
 * The domain that should serve `locale` when `host` does not, preferring the one it is the
 * default for. Undefined when the current host can serve it, which keeps hosts that match no
 * configured domain on relative URLs instead of sending them to a configured domain.
 */
function relocateHostForLocale(host: string, locale: string, locales: LocaleObject[]): string | undefined {
  if (isLocaleServedOnHost(locales, host, locale)) { return }

  const target = locales.find(l => l.code === locale)
  return target?.defaultForDomains?.[0] || target?.domain || target?.domains?.[0]
}

export function matchDomainLocale(locales: LocaleObject[], host: string, pathLocale: string): string | undefined {
  const matches = locales.filter(locale => isLocaleOnHost(locale, host))

  if (matches.length <= 1) {
    return matches[0]?.code
  }

  return (
    // match by current path locale
    matches.find(l => l.code === pathLocale)?.code
    // fallback to default locale for the domain
    || matches.find(l => l.defaultForDomains?.some(domain => normalizeDomain(domain) === host) ?? l.domainDefault)?.code
  )
}

export function domainFromLocale(
  domainLocales: Record<string, { domain: string | undefined }>,
  url: { host: string, protocol: string },
  locale: string,
  locales: LocaleObject[] = normalizedLocales,
): string | undefined {
  const lang = locales.find(x => x.code === locale)
  // lookup the `differentDomain` origin associated with given locale
  const domain
    = domainLocales?.[locale]?.domain
      || lang?.domain
      || lang?.domains?.find(v => normalizeDomain(v) === url.host)
      || relocateHostForLocale(url.host, locale, locales)

  if (!domain) {
    import.meta.dev && console.warn('[nuxt-i18n] Could not find domain name for locale ' + locale)
    return
  }

  if (hasProtocol(domain, { strict: true })) {
    return domain
  }

  return url.protocol + '//' + domain
}

/**
 * Returns the locale object with the domain overridden by `domainLocales` runtime config (see also `getHostLocale`),
 * a no-op outside domain setups since the override entries are empty.
 */
export function withRuntimeDomain<T extends string | LocaleObject>(
  locale: T,
  domainLocales: I18nPublicRuntimeConfig['domainLocales'],
): T {
  if (typeof locale === 'string') {
    return locale
  }
  const properties = locale as LocaleObject
  const domain = domainLocales[properties.code]?.domain
  if (!domain || domain === properties.domain) {
    return locale
  }

  // the override is a single domain, leaving the build time `domains` in place would keep the
  // locale matching the host it was configured with as well as the one it was moved to
  return {
    ...properties,
    domain,
    domains: [domain],
    ...(properties.defaultForDomains?.length ? { defaultForDomains: [domain] } : {}),
  } as T
}

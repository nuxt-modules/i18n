import { hasProtocol } from 'ufo'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { toArray } from './utils'

import type { I18nPublicRuntimeConfig, LocaleObject } from '#internal-i18n-types'

/**
 * Configured domains may include a protocol (used when generating URLs), comparisons
 * against the request host use the host part only. `ufo` helpers are unsuitable here
 * as they treat the `host:port` shape as a protocol.
 */
export const normalizeDomain = (domain: string = '') => domain.replace(/^https?:\/\//, '')

/**
 * Whether the locale is served on the given host
 */
export function isLocaleOnHost(locale: LocaleObject | undefined, host: string): boolean {
  return (
    !!locale && (normalizeDomain(locale.domain) === host || toArray(locale.domains).some(x => normalizeDomain(x) === host))
  )
}

/**
 * Resolves the locale to actually use on `host`: if `locale` is restricted to specific
 * domains and isn't available on this one, falls back to `defaultLocale` instead, so a
 * detected locale never points at a locale/path that doesn't exist on the current domain.
 * A locale with no `domain`/`domains` configured is available everywhere, and an
 * unrecognized host (not listed for any locale) isn't restricted at all.
 */
export function resolveHostLocale(
  locale: string,
  defaultLocale: string,
  host: string | undefined,
  locales: LocaleObject[] = normalizedLocales,
): string {
  const configuredHost = host && locales.some(l => isLocaleOnHost(l, host)) ? host : undefined
  if (!configuredHost) { return locale }

  const localeConfig = locales.find(l => l.code === locale)
  const restricted = localeConfig && (localeConfig.domain || localeConfig.domains?.length)
  return restricted && !isLocaleOnHost(localeConfig, configuredHost) ? defaultLocale : locale
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
  // lookup the `differentDomain` origin associated with given locale.
  const domain = domainLocales?.[locale]?.domain || lang?.domain || lang?.domains?.find(v => normalizeDomain(v) === url.host)

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
  return domain && domain !== properties.domain ? ({ ...properties, domain } as T) : locale
}

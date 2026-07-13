import { hasProtocol } from 'ufo'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { toArray } from './utils'

import type { I18nPublicRuntimeConfig, LocaleObject } from '#internal-i18n-types'

/**
 * Resolves the locale served by `host`.
 *
 * Locales declaring a matching `domain`/`domains` win. When several match the
 * same host, the current path locale is preferred, then the domain's
 * configured default (`defaultForDomains`/`domainDefault`), then the runtime
 * `defaultLocale`. When NO locale declares any domain (single-host runtime
 * mode — one build deployed to hosts unknown at build time), every locale is
 * treated as served by the current host and the same precedence applies.
 *
 * @param locales - locales to match against (domains merged from runtime config)
 * @param host - the request host
 * @param pathLocale - locale parsed from the current path prefix, if any
 * @param defaultLocale - runtime default locale used as the final fallback
 * @returns the resolved locale code, or `undefined` when nothing matches
 */
export function matchDomainLocale(
  locales: LocaleObject[],
  host: string,
  pathLocale: string,
  defaultLocale?: string,
): string | undefined {
  const normalizeDomain = (domain: string = '') => domain.replace(/https?:\/\//, '')
  let matches = locales.filter(
    locale => normalizeDomain(locale.domain) === host || toArray(locale.domains).includes(host),
  )

  // single-host runtime mode: when no locale declares any domain, every locale
  // is served from the current host and the unprefixed default comes from
  // runtime config (`defaultLocale`) — supports deployments where the same
  // build runs on hosts unknown at build time (dynamic preview environments)
  if (!matches.length && locales.every(l => !l.domain && !(Array.isArray(l.domains) && l.domains.length))) {
    matches = locales
  }

  if (matches.length <= 1) {
    return matches[0]?.code
  }

  return (
    // match by current path locale
    matches.find(l => l.code === pathLocale)?.code
    // fallback to default locale for the domain
    || matches.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)?.code
    // fallback to the runtime default locale
    || (defaultLocale ? matches.find(l => l.code === defaultLocale)?.code : undefined)
  )
}

export function domainFromLocale(
  domainLocales: Record<string, { domain: string | undefined }>,
  url: { host: string, protocol: string },
  locale: string,
): string | undefined {
  const lang = normalizedLocales.find(x => x.code === locale)
  // lookup the `differentDomain` origin associated with given locale.
  const domain = domainLocales?.[locale]?.domain || lang?.domain || lang?.domains?.find(v => v === url.host)

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
 * Returns the locale object with the domain overridden by `domainLocales` runtime config (see also `getHostLocale`)
 */
export function withRuntimeDomain<T extends string | LocaleObject>(
  locale: T,
  domainLocales: I18nPublicRuntimeConfig['domainLocales'],
): T {
  if ((!__DIFFERENT_DOMAINS__ && !__MULTI_DOMAIN_LOCALES__) || typeof locale === 'string') {
    return locale
  }
  const properties = locale as LocaleObject
  const domain = domainLocales[properties.code]?.domain
  return domain && domain !== properties.domain ? ({ ...properties, domain } as T) : locale
}

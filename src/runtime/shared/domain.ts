import { hasProtocol } from 'ufo'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { toArray } from './utils'

import type { I18nPublicRuntimeConfig, LocaleObject } from '#internal-i18n-types'

export function matchDomainLocale(locales: LocaleObject[], host: string, pathLocale: string): string | undefined {
  const normalizeDomain = (domain: string = '') => domain.replace(/https?:\/\//, '')
  const matches = locales.filter(
    locale => normalizeDomain(locale.domain) === host || toArray(locale.domains).includes(host),
  )

  if (matches.length <= 1) {
    return matches[0]?.code
  }

  return (
    // match by current path locale
    matches.find(l => l.code === pathLocale)?.code
    // fallback to default locale for the domain
    || matches.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)?.code
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
  if (!__I18N_DOMAINS__ || typeof locale === 'string') {
    return locale
  }
  const properties = locale as LocaleObject
  const domain = domainLocales[properties.code]?.domain
  return domain && domain !== properties.domain ? ({ ...properties, domain } as T) : locale
}

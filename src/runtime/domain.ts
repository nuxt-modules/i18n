import { hasProtocol } from 'ufo'
import { useRouter, useRequestURL } from '#imports'
import { normalizedLocales } from '#build/i18n.options.mjs'
import { defaultRouteNameSuffix, getLocaleFromRouteName, getLocaleFromRoutePath } from '#i18n-kit/routing'

import type { Locale } from 'vue-i18n'
import type { LocaleObject } from '#internal-i18n-types'
import type { Router } from 'vue-router'

const getHost = (): string => useRequestURL({ xForwardedHost: true }).host

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * Filters locales by domain matching current host
 */
function filterMatchingDomainsLocales(locales: LocaleObject[], host: string): LocaleObject[] {
  // normalize domain by removing protocol
  const normalizeDomain = (domain: string = '') => domain.replace(/(https?):\/\//, '')
  return locales.filter(locale => normalizeDomain(locale.domain) === host || toArray(locale.domains).includes(host))
}

export function createDomainLocaleGetter(locales: LocaleObject[]): (path: string) => string | undefined {
  return path => {
    const host = getHost()
    const matches = filterMatchingDomainsLocales(locales, host)

    if (matches.length <= 1 || __I18N_STRATEGY__ === 'no_prefix') {
      if (matches.length > 1 && __I18N_STRATEGY__ === 'no_prefix' && import.meta.dev) {
        console.warn('[nuxt-i18n] Matched multiple domains this is incompatible with no_prefix strategy')
      }
      return matches[0]?.code
    }

    // get prefix from route
    const pathLocale = getLocaleFromRoutePath(path)
    if (pathLocale && matches.some(l => l.code === pathLocale)) {
      return matches.find(l => l.code === pathLocale)?.code
    }

    // fall back to default language on this domain - if set
    return matches.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)?.code
  }
}

export function createDomainFromLocaleGetter(
  domainLocales: Record<string, { domain: string | undefined }>
): (locale: Locale) => string | undefined {
  return locale => {
    const host = getHost()
    const lang = normalizedLocales.find(x => x.code === locale)
    // lookup the `differentDomain` origin associated with given locale.
    const domain = domainLocales?.[locale]?.domain || lang?.domain || lang?.domains?.find(v => v === host)

    if (!domain) {
      import.meta.dev && console.warn('[nuxt-i18n] Could not find domain name for locale ' + locale)
      return
    }

    if (hasProtocol(domain, { strict: true })) {
      return domain
    }

    return useRequestURL().protocol + '//' + domain
  }
}

/**
 * Removes default routes depending on domain
 */
export function setupMultiDomainLocales(defaultLocale: string, router: Router = useRouter()) {
  if (__I18N_STRATEGY__ !== 'prefix_except_default' && __I18N_STRATEGY__ !== 'prefix_and_default') return

  // adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = String(route.name)
    if (routeName.endsWith(defaultRouteNameSuffix)) {
      router.removeRoute(routeName)
      continue
    }

    const locale = getLocaleFromRouteName(routeName)
    if (locale === defaultLocale) {
      router.addRoute({ ...route, path: route.path.replace(`/${locale}`, '') || '/' })
    }
  }
}

/**
 * Returns default locale for the current domain, returns `defaultLocale` by default
 */
export function getDefaultLocaleForDomain(host: string = getHost()): string | undefined {
  return normalizedLocales.find(l => !!l.defaultForDomains?.includes(host))?.code
}

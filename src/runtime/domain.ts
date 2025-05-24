import { hasProtocol } from 'ufo'
import { useRuntimeConfig, useRouter, useRequestURL } from '#imports'
import { normalizedLocales } from '#build/i18n.options.mjs'
import { getLocaleFromRoutePath } from '#i18n-kit/routing'

import type { Locale } from 'vue-i18n'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { Router } from 'vue-router'

function warn(message: string) {
  console.warn(`[${__NUXT_I18N_MODULE_ID__}]: ${message}`)
}

export function getHost(): string {
  return useRequestURL({ xForwardedHost: true }).host
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * Filters locales by domain matching current host
 */
function filterMatchingDomainsLocales(locales: LocaleObject[], host: string = getHost()): LocaleObject[] {
  // normalize domain by removing protocol
  const normalizeDomain = (domain: string = '') => domain.replace(/(https?):\/\//, '')
  return locales.filter(locale => normalizeDomain(locale.domain) === host || toArray(locale.domains).includes(host))
}

export function getLocaleDomain(locales: LocaleObject[], path: string): string {
  const host = getHost()

  const matches = filterMatchingDomainsLocales(locales, host)
  if (matches.length > 1 && __I18N_STRATEGY__ === 'no_prefix') {
    warn('Multiple matching domains found - this is not supported for no_prefix strategy + differentDomains')
  }

  if (matches.length <= 1 || __I18N_STRATEGY__ === 'no_prefix') {
    return matches[0]?.code ?? ''
  }

  // get prefix from route
  const pathLocale = getLocaleFromRoutePath(path)
  if (pathLocale && matches.some(l => l.code === pathLocale)) {
    return matches.find(l => l.code === pathLocale)?.code ?? ''
  }

  // fall back to default language on this domain - if set
  return matches.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)?.code ?? ''
}

export function createDomainFromLocaleGetter(host: string = getHost()): (locale: Locale) => string | undefined {
  const { domainLocales } = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig

  return (locale: Locale): string | undefined => {
    const lang = normalizedLocales.find(x => x.code === locale)
    // lookup the `differentDomain` origin associated with given locale.
    const domain = domainLocales?.[locale]?.domain || lang?.domain || lang?.domains?.find(v => v === host)

    if (!domain) {
      warn('Could not find domain name for locale ' + locale)
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

  const getLocaleFromRouteName = (name: string) => name.split(__ROUTE_NAME_SEPARATOR__).at(1) ?? ''
  const defaultRouteSuffix = __ROUTE_NAME_SEPARATOR__ + __ROUTE_NAME_DEFAULT_SUFFIX__
  // adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = String(route.name)
    if (routeName.endsWith(defaultRouteSuffix)) {
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
export function getDefaultLocaleForDomain(defaultLocale: string, host: string = getHost()): string {
  if (normalizedLocales.some(l => l.defaultForDomains != null)) {
    return normalizedLocales.find(l => !!l.defaultForDomains?.includes(host))?.code ?? ''
  }

  return defaultLocale || ''
}

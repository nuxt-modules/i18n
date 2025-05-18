import { isArray, isString } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import { getRequestProtocol, getRequestHost } from 'h3'
import { useRequestEvent, useRuntimeConfig, useRouter } from '#imports'
import { normalizedLocales } from '#build/i18n.options.mjs'
import {
  normalizeRouteName,
  getRoutePathLocaleRegex,
  getRouteNameLocaleRegex,
  createNameLocaleRegexMatcher
} from '#i18n-kit/routing'
import { createLogger } from '#nuxt-i18n/logger'

import type { Locale } from 'vue-i18n'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { NuxtApp } from '#app'
import type { Router } from 'vue-router'

function formatMessage(message: string) {
  return `[${__NUXT_I18N_MODULE_ID__}]: ${message}`
}

export function getHost() {
  return import.meta.server ? getRequestHost(useRequestEvent()!, { xForwardedHost: true }) : window.location.host
}

/**
 * Filters locales by domain matching current host
 */
function filterMatchingDomainsLocales(locales: LocaleObject[], host: string) {
  return locales.filter(locale => {
    const normalized = locale.domain
      ? hasProtocol(locale.domain)
        ? locale.domain.replace(/(https?):\/\//, '')
        : locale.domain
      : ''
    return normalized === host || (isArray(locale.domains) && locale.domains.includes(host))
  })
}

export function getLocaleDomain(locales: LocaleObject[], path: string): string {
  const logger = /*#__PURE__*/ createLogger(`getLocaleDomain`)
  const host = getHost()

  __DEBUG__ && logger.log(`locating domain for host`, { host, strategy: __I18N_STRATEGY__, path })

  const matches = filterMatchingDomainsLocales(locales, host)
  if (matches.length <= 1 || __I18N_STRATEGY__ === 'no_prefix') {
    __DEBUG__ && matches.length && logger.log(`found one matching domain`, { host, matchedLocale: matches[0].code })
    if (matches.length > 1 && __I18N_STRATEGY__ === 'no_prefix') {
      console.warn(
        formatMessage(
          'Multiple matching domains found - this is not supported for no_prefix strategy + differentDomains'
        )
      )
    }
    return matches[0]?.code ?? ''
  }

  // get prefix from route
  if (path) {
    __DEBUG__ && logger.log(`check matched domain for locale match`, { path, host })
    const matched = path.match(getRoutePathLocaleRegex(matches.map(l => l.code)))?.at(1)
    if (matched) {
      const matchedLocale = matches.find(l => l.code === matched)
      __DEBUG__ && logger.log(`matched locale from path`, { matchedLocale: matchedLocale?.code })
      return matchedLocale?.code ?? ''
    }
  }

  // Fall back to default language on this domain - if set
  const matchingLocale = matches.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)
  __DEBUG__ && logger.log(`no locale matched - using default for this domain`, { matchedLocale: matchingLocale?.code })

  return matchingLocale?.code ?? ''
}

function getProtocol(nuxt: NuxtApp) {
  return import.meta.server
    ? getRequestProtocol(useRequestEvent(nuxt)!) + ':'
    : new URL(window.location.origin).protocol
}

export function createDomainFromLocaleGetter(nuxt: NuxtApp) {
  const host = getHost()
  const { domainLocales } = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig

  return (locale: Locale): string | undefined => {
    const lang = normalizedLocales.find(x => x.code === locale)
    // lookup the `differentDomain` origin associated with given locale.
    const domain = domainLocales?.[locale]?.domain || lang?.domain || lang?.domains?.find(v => v === host)

    if (!domain) {
      console.warn(formatMessage('Could not find domain name for locale ' + locale))
      return
    }

    if (hasProtocol(domain, { strict: true })) {
      return domain
    }

    return getProtocol(nuxt) + '//' + domain
  }
}

/**
 * Removes default routes depending on domain
 */
export function setupMultiDomainLocales(defaultLocaleDomain: string, router: Router = useRouter()) {
  // incompatible strategy
  if (!(__I18N_STRATEGY__ === 'prefix_except_default' || __I18N_STRATEGY__ === 'prefix_and_default')) return

  const matcher = createNameLocaleRegexMatcher(
    getRouteNameLocaleRegex({
      localeCodes: [defaultLocaleDomain],
      separator: __ROUTE_NAME_SEPARATOR__,
      defaultSuffix: __ROUTE_NAME_DEFAULT_SUFFIX__
    })
  )
  const defaultRouteSuffix = __ROUTE_NAME_SEPARATOR__ + __ROUTE_NAME_DEFAULT_SUFFIX__
  // Adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = normalizeRouteName(route.name)
    if (routeName.endsWith(defaultRouteSuffix)) {
      router.removeRoute(routeName)
      continue
    }

    const routeNameLocale = matcher(routeName)
    if (routeNameLocale === defaultLocaleDomain) {
      router.addRoute({
        ...route,
        path: route.path === `/${routeNameLocale}` ? '/' : route.path.replace(`/${routeNameLocale}`, '')
      })
    }
  }
}

/**
 * Returns default locale for the current domain, returns `defaultLocale` by default
 */
export function getDefaultLocaleForDomain(runtimeI18n: I18nPublicRuntimeConfig) {
  const { locales, defaultLocale } = runtimeI18n
  const host = getHost()
  if (locales.some(l => !isString(l) && l.defaultForDomains != null)) {
    const findDefaultLocale = locales.find(
      (l): l is LocaleObject => !isString(l) && !!l.defaultForDomains?.includes(host)
    )
    return findDefaultLocale?.code ?? ''
  }

  return defaultLocale || ''
}

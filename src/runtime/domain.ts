import { isArray, isString } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import { getRequestProtocol, getRequestHost } from 'h3'
import { useRequestEvent, useRuntimeConfig, useRouter } from '#imports'
import { normalizedLocales } from '#build/i18n.options.mjs'
import { getRoutePathLocaleRegex, getRouteName } from '#i18n-kit/routing'
import { createLogger } from '#nuxt-i18n/logger'
import { formatMessage } from './utils'

import type { Locale } from 'vue-i18n'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from './types'
import type { NuxtApp } from '#app'
import { getCompatRoutePath } from './internal'

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

export function getLocaleDomain(locales: LocaleObject[], strategy: string, route: string | CompatRoute): string {
  const logger = /*#__PURE__*/ createLogger(`getLocaleDomain`)
  const host = getHost()
  const path = getCompatRoutePath(route)

  __DEBUG__ && logger.log(`locating domain for host`, { host, strategy, path })

  const matches = filterMatchingDomainsLocales(locales, host)
  if (matches.length <= 1 || strategy === 'no_prefix') {
    __DEBUG__ && matches.length && logger.log(`found one matching domain`, { host, matchedLocale: matches[0].code })
    return matches[0]?.code ?? ''
  }

  if (strategy === 'no_prefix') {
    console.warn(
      formatMessage('Multiple matching domains found - this is not supported for no_prefix strategy + differentDomains')
    )
    // Just return the first matching domain locale
    return matches[0]?.code ?? ''
  }

  // get prefix from route
  if (route && path) {
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
export function setupMultiDomainLocales(runtimeI18n: I18nPublicRuntimeConfig, defaultLocaleDomain: string) {
  const { multiDomainLocales, strategy, routesNameSeparator, defaultLocaleRouteNameSuffix } = runtimeI18n

  // feature disabled
  if (!multiDomainLocales) return

  // incompatible strategy
  if (!(strategy === 'prefix_except_default' || strategy === 'prefix_and_default')) return

  const router = useRouter()
  const defaultRouteSuffix = [routesNameSeparator, defaultLocaleRouteNameSuffix].join('')

  // Adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = getRouteName(route.name)

    if (routeName.endsWith(defaultRouteSuffix)) {
      router.removeRoute(routeName)
      continue
    }

    const routeNameLocale = routeName.split(routesNameSeparator)[1]
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
  const { locales, defaultLocale, multiDomainLocales } = runtimeI18n
  if (!multiDomainLocales) {
    return defaultLocale || ''
  }

  const host = getHost()
  if (locales.some(l => !isString(l) && l.defaultForDomains != null)) {
    const findDefaultLocale = locales.find(
      (l): l is LocaleObject => !isString(l) && !!l.defaultForDomains?.includes(host)
    )
    return findDefaultLocale?.code ?? ''
  }

  return defaultLocale || ''
}

import { isArray, isString } from '@intlify/shared'
import { hasProtocol } from 'ufo'
import { getRequestProtocol } from 'h3'
import { useRequestEvent, useRuntimeConfig, useRouter, useRequestHeaders, useNuxtApp } from '#imports'
import { normalizedLocales } from '#build/i18n.options.mjs'
import { getLocalesRegex, getRouteName } from './routing/utils'
import { createLogger } from '#nuxt-i18n/logger'
import { formatMessage } from './utils'

import type { Locale } from 'vue-i18n'
import type { LocaleObject } from '#internal-i18n-types'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { CompatRoute } from './types'

export function getHost() {
  if (import.meta.client) {
    return window.location.host
  }

  const header = useRequestHeaders(['x-forwarded-host', 'host'])
  return header['x-forwarded-host'] || header['host'] || ''
}

export function getLocaleDomain(locales: LocaleObject[], strategy: string, route: string | CompatRoute): string {
  const logger = /*#__PURE__*/ createLogger(`getLocaleDomain`)
  const host = getHost()
  if (!host) {
    return host
  }

  const routePath = isString(route) ? route : route.path
  const matchingLocales = locales.filter(locale => {
    if (locale.domain) {
      return (hasProtocol(locale.domain) ? locale.domain.replace(/(http|https):\/\//, '') : locale.domain) === host
    }
    return isArray(locale?.domains) ? locale.domains.includes(host) : false
  })

  __DEBUG__ && logger.log(`locating domain for host`, { host, strategy, path: routePath })

  if (matchingLocales.length === 0) {
    return ''
  }

  if (matchingLocales.length === 1) {
    __DEBUG__ && logger.log(`found one matching domain`, { host, matchedLocale: matchingLocales[0].code })
    return matchingLocales[0]?.code ?? ''
  }

  if (strategy === 'no_prefix') {
    console.warn(
      formatMessage(
        'Multiple matching domains found! This is not supported for no_prefix strategy in combination with differentDomains!'
      )
    )
    // Just return the first matching domain locale
    return matchingLocales[0]?.code ?? ''
  }

  // get prefix from route
  if (route && routePath) {
    __DEBUG__ && logger.log(`check matched domain for locale match`, { path: routePath, host })

    const matched = routePath.match(getLocalesRegex(matchingLocales.map(l => l.code)))?.at(1)
    if (matched) {
      const matchingLocale = matchingLocales.find(l => l.code === matched)
      __DEBUG__ && logger.log(`matched locale from path`, { matchedLocale: matchingLocale?.code })
      return matchingLocale?.code ?? ''
    }
  }

  // Fall back to default language on this domain - if set
  const matchingLocale = matchingLocales.find(l => l.defaultForDomains?.includes(host) ?? l.domainDefault)
  __DEBUG__ && logger.log(`no locale matched - using default for this domain`, { matchedLocale: matchingLocale?.code })

  return matchingLocale?.code ?? ''
}

export function getDomainFromLocale(localeCode: Locale): string | undefined {
  const nuxt = useNuxtApp()
  const host = getHost()
  const { domainLocales } = useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
  const lang = normalizedLocales.find(locale => locale.code === localeCode)
  // lookup the `differentDomain` origin associated with given locale.
  const domain = domainLocales?.[localeCode]?.domain || lang?.domain || lang?.domains?.find(v => v === host)

  if (!domain) {
    console.warn(formatMessage('Could not find domain name for locale ' + localeCode))
    return
  }

  if (hasProtocol(domain, { strict: true })) {
    return domain
  }

  const protocol = import.meta.server
    ? getRequestProtocol(useRequestEvent(nuxt)!) + ':'
    : new URL(window.location.origin).protocol

  return protocol + '//' + domain
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

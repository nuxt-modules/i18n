import type { NuxtI18nOptions, LocaleObject, NormalizedLocaleObject, Strategies } from '../../src/types'
import type { NuxtPage } from '@nuxt/schema'
import type { ComputedRouteOptions, LocalizableRoute, RouteOptionsResolver } from '../../src/kit/gen'

import { isString } from '@intlify/shared'
import { normalizeDomainLocale } from '../../src/utils'
import { canonicalDomainFromLocale, domainForHost, domainFromLocale } from '../../src/runtime/shared/domain'
import { createBaseUrlGetter } from '../../src/runtime/context'

/** Mirrors how `resolveContext` normalizes configured locales - see `src/context.ts` */
export const getNormalizedLocales = (locales: string[] | LocaleObject[] = []): NormalizedLocaleObject[] =>
  locales.map(x => normalizeDomainLocale(isString(x) ? { code: x, language: x } : x))

type MarkRequired<Type, Keys extends keyof Type> = Type extends Type ? Omit<Type, Keys> & Required<Pick<Type, Keys>> : never;
export function getNuxtOptions(
  pages: Required<NuxtI18nOptions>['pages'],
  customRoutes: Required<NuxtI18nOptions>['customRoutes'] = 'config',
  defaultLocale = 'en'
): MarkRequired<
  NuxtI18nOptions,
  'strategy' | 'defaultLocaleRouteNameSuffix' | 'trailingSlash' | 'routesNameSeparator'
> {
  return {
    customRoutes,
    pages,
    defaultLocale,
    strategy: 'prefix_except_default',
    defaultLocaleRouteNameSuffix: 'default',
    trailingSlash: false,
    routesNameSeparator: '___',
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ja', language: 'ja-JP', file: 'ja.json', name: 'Japanses' },
      { code: 'fr', language: 'fr-FR', file: 'fr.json', name: 'Français' }
    ] as LocaleObject[]
  }
}

export function stripFilePropertyFromPages(pages: NuxtPage[]) {
  return pages.map(page => {
    delete page.file
    if (page.children) {
      page.children = stripFilePropertyFromPages(page.children)
    }
    return page
  })
}

/**
 * Creates a mock `RouteOptionsResolver` from a simple map, bypassing `NuxtPageAnalyzeContext`.
 *
 * @param optionsMap - keyed by route name or path
 *   - `ComputedRouteOptions`: custom locales/paths for the route
 *   - `false`: route localization disabled (resolver returns `undefined`)
 *   - `undefined` entry or missing key with no file: pass-through (resolver returns `undefined`)
 * @param fallbackLocales - locales returned for routes not in the map (defaults to resolver's localeCodes)
 */
export function createMockOptionsResolver(
  optionsMap: Record<string, ComputedRouteOptions | false | undefined> = {},
  fallbackLocales?: string[]
): RouteOptionsResolver {
  return (route: LocalizableRoute, localeCodes: string[]) => {
    const key = route.name || route.path
    if (key && key in optionsMap) {
      const value = optionsMap[key]
      // false = disabled
      if (value === false) return undefined
      // explicit options
      if (value != null) return value
      // undefined = pass-through
      return undefined
    }

    // redirect-only routes without a file are not localizable
    if (route.redirect && !route.file) return undefined

    // default: all locales, no custom paths
    return { locales: fallbackLocales ?? localeCodes, paths: {} }
  }
}

/**
 * Creates a config object compatible with `localizeRoutes()` from minimal inputs.
 */
export function createTestConfig(opts: {
  locales?: string[] | LocaleObject[]
  strategy?: Strategies
  defaultLocale?: string
  trailingSlash?: boolean
  optionsResolver?: RouteOptionsResolver
  domains?: boolean
  routesNameSeparator?: string
  defaultLocaleRouteNameSuffix?: string
  compactRoutes?: boolean
}) {
  return {
    locales: getNormalizedLocales(opts.locales ?? ['en', 'fr']),
    strategy: opts.strategy ?? 'prefix_except_default' as Strategies,
    defaultLocale: opts.defaultLocale ?? 'en',
    trailingSlash: opts.trailingSlash ?? false,
    routesNameSeparator: opts.routesNameSeparator ?? '___',
    defaultLocaleRouteNameSuffix: opts.defaultLocaleRouteNameSuffix ?? 'default',
    optionsResolver: opts.optionsResolver,
    domains: opts.domains,
    compactRoutes: opts.compactRoutes,
  }
}

/**
 * Mirrors how `createNuxtI18nContext` builds the base URL getters - see `src/runtime/context.ts`.
 * Derived through the real resolvers rather than stubbed per suite: a hand-written getter cannot
 * expose a current-host preference, which is what let #4106's hreflang bug through.
 */
export function createTestBaseUrls(opts: {
  locales: NormalizedLocaleObject[]
  host: string
  protocol?: string
  baseUrl?: string
  appBase?: string
  domains?: boolean
  defaultLocale?: string
}) {
  const url = { host: opts.host, protocol: opts.protocol ?? 'https:' }
  // `module.ts` seeds an entry per locale from the scalar `domain`
  const domainLocales = Object.fromEntries(opts.locales.map(l => [l.code, { domain: l.domain ?? '' }]))
  const shared = {
    baseUrl: opts.baseUrl,
    appBase: opts.appBase ?? '/',
    domains: opts.domains ?? true,
    getDomainForHost: () => domainForHost(domainLocales, url, opts.locales),
  }

  return {
    getBaseUrl: createBaseUrlGetter({
      ...shared,
      getDomainFromLocale: l => domainFromLocale(domainLocales, url, l, opts.locales),
    }),
    getCanonicalBaseUrl: createBaseUrlGetter({
      ...shared,
      getDomainFromLocale: l =>
        canonicalDomainFromLocale(domainLocales, url, l, opts.defaultLocale, opts.locales),
    }),
  }
}

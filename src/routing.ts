import { toArray } from './utils'
import { isObject } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { NuxtPage } from '@nuxt/schema'
import type { MarkRequired, MarkOptional } from 'ts-essentials'
import type { NuxtI18nOptions, PrefixLocalizedRouteOptions, RouteOptionsResolver } from './types'

const join = (...args: (string | undefined)[]) => args.filter(Boolean).join('')

/**
 * Options to compute route localizing
 *
 * @remarks
 * The route options that is compute the route to be localized on {@link localizeRoutes}
 *
 * @public
 */
export declare interface ComputedRouteOptions {
  locales: readonly string[]
  paths: Record<string, string>
}

function shouldPrefix(
  localizeOptions: PrefixLocalizedRouteOptions,
  options: LocalizeRoutesParams,
  extra = false
): boolean {
  const isDefaultLocale = localizeOptions.locale === (localizeOptions.defaultLocale ?? '')
  const isChildWithRelativePath = localizeOptions.parent != null && !localizeOptions.path.startsWith('/')

  // no need to add prefix if child's path is relative
  return (
    !extra &&
    !isChildWithRelativePath &&
    options.strategy !== 'no_prefix' &&
    // skip default locale if strategy is 'prefix_except_default'
    !(isDefaultLocale && options.strategy === 'prefix_except_default')
  )
}

function adjustRoutePathForTrailingSlash(localized: LocalizedRoute, trailingSlash: boolean) {
  const isChildWithRelativePath = localized.parent != null && !localized.path.startsWith('/')
  return localized.path.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
}

type LocalizeRoutesParams = MarkRequired<
  NuxtI18nOptions,
  'strategy' | 'locales' | 'routesNameSeparator' | 'trailingSlash' | 'defaultLocaleRouteNameSuffix'
> & {
  includeUnprefixedFallback?: boolean
  optionsResolver?: RouteOptionsResolver
  localeCodes: string[]
}

function shouldLocalizeRoutes(options: NuxtI18nOptions) {
  if (options.strategy === 'no_prefix') {
    // no_prefix is only supported when using a separate domain per locale
    if (!options.differentDomains) return false

    // check if domains are used multiple times
    const domains = new Set<string>()
    for (const locale of options.locales || []) {
      if (typeof locale === 'string') continue
      if (locale.domain) {
        if (domains.has(locale.domain)) {
          console.error(
            `Cannot use \`strategy: no_prefix\` when using multiple locales on the same domain - found multiple entries with ${locale.domain}`
          )
          return false
        }

        domains.add(locale.domain)
      }
    }
  }

  return true
}

type LocalizedRoute = NuxtPage & { locale: Locale; parent: NuxtPage | undefined }
type LocalizeRouteParams = {
  /**
   * locales to use for localization
   */
  locales: string[]

  defaultLocales: string[]
  /**
   * parent route
   */
  parent?: NuxtPage
  /**
   * localized parent route
   */
  parentLocalized?: NuxtPage
  /**
   * indicates whether this is a default route for 'prefix_and_default' strategy
   */
  extra?: boolean
}

function localizeSingleRoute(
  route: NuxtPage,
  options: LocalizeRoutesParams,
  { locales = [], parent, parentLocalized, extra = false, defaultLocales }: LocalizeRouteParams
): NuxtPage[] {
  // skip route localization
  if (route.redirect && !route.file) {
    return [route]
  }

  // resolve with route (page) options
  const routeOptions = options.optionsResolver?.(route, locales)
  if (options.optionsResolver != null && routeOptions == null) {
    return [route]
  }

  // component specific options
  const componentOptions: ComputedRouteOptions = {
    // filter locales to prevent child routes from being localized even though they are disabled in the configuration.
    locales: locales.filter(locale => (routeOptions?.locales ?? locales).includes(locale)),
    paths: {},
    ...routeOptions
  }

  const { strategy, trailingSlash, multiDomainLocales, routesNameSeparator, defaultLocaleRouteNameSuffix } = options
  const resultRoutes: (LocalizedRoute | NuxtPage)[] = []
  for (const locale of componentOptions.locales) {
    const localized: LocalizedRoute = { ...route, locale, parent }

    const isDefaultLocale = defaultLocales.includes(locale)
    const addDefaultTree = isDefaultLocale && strategy === 'prefix_and_default' && parent == null && !extra

    // localize route again for strategy `prefix_and_default`
    if (addDefaultTree && parent == null && !extra) {
      const extraRoutes = localizeSingleRoute(route, options, { locales: [locale], extra: true, defaultLocales })
      resultRoutes.push(...extraRoutes)
    }

    // localize route name
    if (localized.name) {
      const nameSegments = [localized.name, routesNameSeparator, locale]
      if (extra) {
        nameSegments.push(routesNameSeparator, defaultLocaleRouteNameSuffix)
      }
      localized.name = join(...nameSegments)
    }

    // use custom path if found
    localized.path = componentOptions.paths?.[locale] ?? localized.path

    const defaultLocale = isDefaultLocale ? locale : options.defaultLocale
    if (shouldPrefix({ defaultLocale, ...localized }, options, extra)) {
      if (multiDomainLocales && (strategy === 'prefix_except_default' || strategy === 'prefix_and_default')) {
        resultRoutes.push({
          ...localized,
          name: join(localized.name, routesNameSeparator, defaultLocaleRouteNameSuffix)
        })
      }

      localized.path = join('/', locale, localized.path)

      if (isDefaultLocale && strategy === 'prefix' && options.includeUnprefixedFallback) {
        resultRoutes.push({ ...route, locale, parent })
      }
    }

    // TODO: alias custom paths?
    // add prefixes to aliases where applicable
    if (localized.alias) {
      const newAliases: string[] = []
      for (const alias of toArray(localized.alias)) {
        let localizedAlias = alias
        if (shouldPrefix({ defaultLocale, ...localized, path: alias }, options, extra)) {
          localizedAlias = join('/', locale, localizedAlias)
        }
        localizedAlias &&= adjustRoutePathForTrailingSlash({ ...localized, path: localizedAlias }, trailingSlash)
        newAliases.push(localizedAlias)
      }
      localized.alias = newAliases
    }

    localized.path &&= adjustRoutePathForTrailingSlash(localized, trailingSlash)

    // remove parent path from child route
    if (parentLocalized != null) {
      localized.path = localized.path.replace(parentLocalized.path + '/', '')

      // handle parent/index
      if (localized.path === parentLocalized.path) {
        localized.path = ''
      }
    }

    // localize child routes if set
    if (localized.children) {
      let children: NuxtPage[] = []
      for (const child of localized.children) {
        children = children.concat(
          localizeSingleRoute(child, options, {
            locales: [locale],
            parent: route,
            parentLocalized: localized,
            extra,
            defaultLocales
          })
        )
      }
      localized.children = children
    }

    resultRoutes.push(localized)
  }

  // remove properties used for localization process
  for (const x of resultRoutes as MarkOptional<LocalizedRoute, 'parent' | 'locale'>[]) {
    delete x.parent
    delete x.locale
  }

  return resultRoutes
}

/**
 * Localize routes
 *
 * @param routes - Some routes
 * @param options - An options
 *
 * @returns Localized routes
 *
 * @public
 */
export function localizeRoutes(routes: NuxtPage[], options: LocalizeRoutesParams): NuxtPage[] {
  if (!shouldLocalizeRoutes(options)) return routes

  let defaultLocales = [options.defaultLocale ?? '']
  if (options.differentDomains) {
    const domainDefaults = options.locales
      .filter(locale => (isObject(locale) ? locale.domainDefault : false))
      .map(locale => (isObject(locale) ? locale.code : locale))
    defaultLocales = defaultLocales.concat(domainDefaults)
  }

  let processed: NuxtPage[] = []
  for (const route of routes) {
    processed = processed.concat(localizeSingleRoute(route, options, { locales: options.localeCodes, defaultLocales }))
  }
  return processed
}

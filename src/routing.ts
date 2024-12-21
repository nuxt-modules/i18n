import { getNormalizedLocales, toArray } from './utils'
import { isObject } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { NuxtPage } from '@nuxt/schema'
import type { MarkRequired, MarkOptional } from 'ts-essentials'
import type { ComputedRouteOptions, NuxtI18nOptions, PrefixLocalizedRouteOptions, RouteOptionsResolver } from './types'

const join = (...args: (string | undefined)[]) => args.filter(Boolean).join('')

export function prefixLocalizedRoute(
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

export type LocalizeRoutesParams = MarkRequired<
  NuxtI18nOptions,
  'strategy' | 'locales' | 'routesNameSeparator' | 'trailingSlash' | 'defaultLocaleRouteNameSuffix'
> & {
  includeUnprefixedFallback?: boolean
  optionsResolver?: RouteOptionsResolver
}

export function shouldLocalizeRoutes(options: NuxtI18nOptions) {
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

/**
 * Localize routes
 *
 * @param routes - Some routes
 * @param options - An options
 *
 * @returns Localized routes
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

  function localizeRoute(
    route: NuxtPage,
    { locales = [], parent, parentLocalized, extra = false }: LocalizeRouteParams
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

    const localizedRoutes: (LocalizedRoute | NuxtPage)[] = []
    for (const locale of componentOptions.locales) {
      const localized: LocalizedRoute = { ...route, locale, parent }
      const isDefaultLocale = defaultLocales.includes(locale)
      const addDefaultTree = isDefaultLocale && options.strategy === 'prefix_and_default' && parent == null && !extra

      // localize route again for strategy `prefix_and_default`
      if (addDefaultTree && parent == null && !extra) {
        localizedRoutes.push(...localizeRoute(route, { locales: [locale], extra: true }))
      }

      const nameSegments = [localized.name, options.routesNameSeparator, locale]
      if (extra) {
        nameSegments.push(options.routesNameSeparator, options.defaultLocaleRouteNameSuffix)
      }

      // localize name if set
      localized.name &&= join(...nameSegments)

      // use custom path if found
      localized.path = componentOptions.paths?.[locale] ?? localized.path

      const localePrefixable = prefixLocalizedRoute(
        { defaultLocale: isDefaultLocale ? locale : options.defaultLocale, ...localized },
        options,
        extra
      )
      if (localePrefixable) {
        if (
          options.multiDomainLocales &&
          (options.strategy === 'prefix_except_default' || options.strategy === 'prefix_and_default')
        ) {
          localizedRoutes.push({
            ...localized,
            name: `${localized.name}___${options.defaultLocaleRouteNameSuffix}`
          })
        }

        localized.path = join('/', locale, localized.path)

        if (isDefaultLocale && options.strategy === 'prefix' && options.includeUnprefixedFallback) {
          localizedRoutes.push({ ...route, locale, parent })
        }
      }

      // TODO: alias custom paths?
      // add prefixes to aliases where applicable
      if (localized.alias) {
        const aliases = toArray(localized.alias)
        const localizedAliases: string | string[] | undefined = []

        for (const alias of aliases) {
          const aliasPrefixable = prefixLocalizedRoute(
            { defaultLocale: isDefaultLocale ? locale : options.defaultLocale, ...localized, path: alias },
            options,
            extra
          )

          let localizedAlias = alias
          if (aliasPrefixable) {
            localizedAlias = join('/', locale, localizedAlias)
          }

          localizedAlias &&= adjustRoutePathForTrailingSlash(
            { ...localized, path: localizedAlias },
            options.trailingSlash
          )

          localizedAliases.push(localizedAlias)
        }

        localized.alias = localizedAliases
      }

      localized.path &&= adjustRoutePathForTrailingSlash(localized, options.trailingSlash)

      // remove parent path from child route
      if (parentLocalized != null) {
        localized.path = localized.path.replace(parentLocalized.path + '/', '')
      }

      // localize child routes if set
      localized.children &&= localized.children.flatMap(child =>
        localizeRoute(child, { locales: [locale], parent: route, parentLocalized: localized, extra })
      )

      localizedRoutes.push(localized)
    }

    // remove properties used for localization process
    return localizedRoutes.flatMap((x: MarkOptional<LocalizedRoute, 'parent' | 'locale'>) => {
      delete x.parent
      delete x.locale
      return x
    })
  }

  return routes.flatMap(route =>
    localizeRoute(route, { locales: getNormalizedLocales(options.locales).map(x => x.code) })
  )
}

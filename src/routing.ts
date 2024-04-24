import { getNormalizedLocales } from './utils'
import { isObject } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { NuxtPage } from '@nuxt/schema'
import type { MarkRequired, MarkOptional } from 'ts-essentials'
import type { NuxtI18nOptions, PrefixLocalizedRouteOptions, RouteOptionsResolver } from './types'

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

export function prefixLocalizedRoute(
  isDefaultLocale: boolean,
  localizeOptions: PrefixLocalizedRouteOptions,
  options: LocalizeRoutesParams,
  extra = false
): boolean {
  const isChildWithRelativePath = localizeOptions.parent != null && !localizeOptions.path.startsWith('/')

  // no need to add prefix if child's path is relative
  return (
    !extra &&
    !isChildWithRelativePath &&
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
 *
 * @public
 */
export function localizeRoutes(routes: NuxtPage[], options: LocalizeRoutesParams): NuxtPage[] {
  if (options.strategy === 'no_prefix') {
    return routes
  }

  let defaultLocales = [options.defaultLocale ?? '']
  if (options.differentDomains) {
    const domainDefaults = options.locales
      .filter(locale => (isObject(locale) ? locale.domainDefault : false))
      .map(locale => (isObject(locale) ? locale.code : locale))
    defaultLocales = defaultLocales.concat(domainDefaults)
  }

  function localizeRoute(route: NuxtPage, { locales = [], parent, parentLocalized }: LocalizeRouteParams): NuxtPage[] {
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
    const defaultLocale = defaultLocales[0]

    let nonDefaultLocales = componentOptions.locales

    if (options.strategy !== 'prefix') {
      nonDefaultLocales = componentOptions.locales.filter(l => l !== defaultLocale)
    }

    const localeRegex = nonDefaultLocales.join('|')

    // Добавление роута для дефолтной локали
    if ((options.strategy !== 'prefix' || options.includeUnprefixedFallback) && !parentLocalized) {
      const defaultLocalized: LocalizedRoute = { ...route, locale: defaultLocale, parent }
      localizedRoutes.push(defaultLocalized)
    }

    if (options.strategy === 'prefix' && !parentLocalized) {
      const redirectLocalized: LocalizedRoute = {
        ...route,
        locale: `/`,
        name: 'index',
        redirect: `/${defaultLocale}`,
        parent
      }
      localizedRoutes.push(redirectLocalized)
    }

    // Добавление объединенного роута для всех не дефолтных локалей
    const combinedLocalized: LocalizedRoute = { ...route, locale: `/:locale(${localeRegex})`, parent }
    let routePath = combinedLocalized.path
    if (parentLocalized != null && parentLocalized.path.startsWith('/:locale')) {
      routePath = routePath.replace(parentLocalized.path + '/', '')
    }
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath
    }
    if (parentLocalized != null) {
      combinedLocalized.path = parentLocalized.path + routePath
    } else {
      combinedLocalized.path = `/:locale(${localeRegex})` + routePath
    }

    if (combinedLocalized.name) {
      combinedLocalized.name = combinedLocalized.name.replace(`${options.routesNameSeparator}locale`, '')
      combinedLocalized.name += options.routesNameSeparator + 'locale'
    }

    combinedLocalized.path &&= adjustRoutePathForTrailingSlash(combinedLocalized, options.trailingSlash)

    combinedLocalized.children &&= combinedLocalized.children.flatMap(child =>
      localizeRoute(child, { locales: [...nonDefaultLocales], parent: route, parentLocalized: combinedLocalized })
    )

    for (const locale of componentOptions.locales) {
      if (componentOptions.paths?.[locale]) {
        const subLocalized: LocalizedRoute = { ...route, locale: locale, parent }

        let prefix = `/:locale(${locale})`
        if (options.strategy !== 'prefix' && locale === defaultLocale) {
          prefix = ''
          subLocalized.name = route.name + options.routesNameSeparator + locale
        } else {
          subLocalized.name = route.name + options.routesNameSeparator + 'locale' + options.routesNameSeparator + locale
        }
        subLocalized.path = prefix + componentOptions.paths[locale]

        // subLocalized.children &&= subLocalized.children.flatMap(child => {
        //   return { ...child, ...{ name: child.name + options.routesNameSeparator + 'locale' + options.routesNameSeparator + locale } }
        // })

        combinedLocalized.children &&= combinedLocalized.children.flatMap(child =>
          localizeRoute(child, { locales: [locale], parent: route, parentLocalized: subLocalized })
        )

        localizedRoutes.push(subLocalized)
      }
    }

    localizedRoutes.push(combinedLocalized)

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

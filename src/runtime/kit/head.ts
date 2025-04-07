import { hasProtocol, joinURL, withQuery } from 'ufo'

import type { QueryValue } from 'ufo'
import type { RouteLocationNormalizedLoadedGeneric, RouteLocationResolvedGeneric } from 'vue-router'
import type { HeadLocale } from './types'

/**
 * Meta attributes for head properties.
 * @internal
 */
export type MetaAttrs = Record<string, string>

/**
 * I18n header meta info.
 * @internal
 */
export interface I18nHeadMetaInfo {
  htmlAttrs: MetaAttrs
  meta: MetaAttrs[]
  link: MetaAttrs[]
}

type SeoAttributesOptions = {
  /**
   * An array of strings corresponding to query params you would like to include in your canonical URL.
   * @default []
   */
  canonicalQueries?: string[]
}

/**
 * @internal
 */
export type HeadOptions = {
  key: string
  dir: boolean
  lang: boolean
  seo: boolean | SeoAttributesOptions | undefined
  currentDir: string
  currentLanguage: string | undefined
  baseUrl: string
  locales: HeadLocale[]
  defaultLocale: string | undefined
  hreflangLinks: boolean
  strictCanonicals: boolean
  canonicalQueries: string[]
  getRouteBaseName: (route: RouteLocationResolvedGeneric | RouteLocationNormalizedLoadedGeneric) => string | undefined
  getLocaleRoute: (route: RouteLocationResolvedGeneric) => RouteLocationResolvedGeneric | undefined
  getCurrentRoute: () => RouteLocationNormalizedLoadedGeneric
  getRouteWithoutQuery: () => RouteLocationResolvedGeneric
  getLocalizedRoute: (locale: string, route: RouteLocationResolvedGeneric | undefined) => string
}

/**
 * @internal
 */
export function localeHead(options: HeadOptions): I18nHeadMetaInfo {
  const metaObject: I18nHeadMetaInfo = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  // Adding Direction Attribute
  if (options.dir) {
    metaObject.htmlAttrs.dir = options.currentDir
  }

  if (options.lang && options.currentLanguage) {
    metaObject.htmlAttrs.lang = options.currentLanguage
  }

  // Adding SEO Meta
  if (options.seo) {
    // prettier-ignore
    metaObject.link = metaObject.link.concat(
      getHreflangLinks(options),
      getCanonicalLink(options) ?? []
    )

    // prettier-ignore
    metaObject.meta = metaObject.meta.concat(
      getOgUrl(options) ?? [],
      getCurrentOgLocale(options) ?? [],
      getAlternateOgLocales(options)
    )
  }

  return metaObject
}

function getHreflangLinks(options: HeadOptions) {
  if (!options.hreflangLinks) return []

  const localeMap = new Map<string, HeadLocale>()
  for (const locale of options.locales) {
    if (!locale.language) {
      console.warn('Locale `language` ISO code is required to generate alternate link')
      continue
    }

    const [language, region] = locale.language.split('-')
    if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
      localeMap.set(language, locale)
    }

    localeMap.set(locale.language, locale)
  }

  const routeWithoutQuery = options.strictCanonicals ? options.getRouteWithoutQuery() : undefined

  const links: MetaAttrs[] = []
  for (const [language, mapLocale] of localeMap.entries()) {
    const localePath = options.getLocalizedRoute(mapLocale.code, routeWithoutQuery)
    if (!localePath) continue

    const href = withQuery(
      // localized paths with domain already contain baseUrl
      hasProtocol(localePath) ? localePath : joinURL(options.baseUrl, localePath),
      options.strictCanonicals ? getCanonicalQueryParams(options) : {}
    )

    links.push({ [options.key]: `i18n-alt-${language}`, rel: 'alternate', href, hreflang: language })
    if (options.defaultLocale && options.defaultLocale === mapLocale.code) {
      links.unshift({ [options.key]: 'i18n-xd', rel: 'alternate', href, hreflang: 'x-default' })
    }
  }
  return links
}

function getCanonicalUrl(options: HeadOptions) {
  const route = options.getCurrentRoute()
  const currentRoute = options.getLocaleRoute(
    Object.assign({}, route, { path: undefined, name: options.getRouteBaseName(route) })
  )

  if (!currentRoute) return ''
  return withQuery(joinURL(options.baseUrl, currentRoute.path), getCanonicalQueryParams(options))
}

function getCanonicalLink(options: HeadOptions): MetaAttrs | undefined {
  const href = getCanonicalUrl(options)
  if (href) {
    return { [options.key]: 'i18n-can', rel: 'canonical', href }
  }
}

function getCanonicalQueryParams(options: HeadOptions) {
  const route = options.getCurrentRoute()
  const currentRoute = options.getLocaleRoute(
    Object.assign({}, route, { path: undefined, name: options.getRouteBaseName(route) })
  )

  const currentRouteQuery = currentRoute?.query ?? {}
  const params: Record<string, QueryValue[]> = {}
  for (const param of options.canonicalQueries.filter(x => x in currentRouteQuery)) {
    params[param] ??= []
    for (const val of toArray(currentRouteQuery[param])) {
      params[param].push(val || '')
    }
  }

  return params
}

function getOgUrl(options: HeadOptions): MetaAttrs | undefined {
  const href = getCanonicalUrl(options)
  if (href) {
    return { [options.key]: 'i18n-og-url', property: 'og:url', content: href }
  }
}

function getCurrentOgLocale(options: HeadOptions): MetaAttrs | undefined {
  if (!options.currentLanguage) return
  return { [options.key]: 'i18n-og', property: 'og:locale', content: formatOgLanguage(options.currentLanguage) }
}

function getAlternateOgLocales(options: HeadOptions): MetaAttrs[] {
  const alternateLocales = options.locales.filter(
    locale => locale.language && locale.language !== options.currentLanguage
  )

  return alternateLocales.map(locale => ({
    [options.key]: `i18n-og-alt-${locale.language}`,
    property: 'og:locale:alternate',
    content: formatOgLanguage(locale.language)
  }))
}

/**
 * Replaces hyphens with underscores to match spec `language_TERRITORY`
 */
function formatOgLanguage(val: string = '') {
  return val.replace(/-/g, '_')
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

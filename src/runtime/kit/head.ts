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
   * An array of strings corresponding to query params
   * to include in your canonical URL.
   * @default []
   */
  canonicalQueries?: string[]
}

/**
 * @internal
 */
export type HeadContext = {
  key: string
  dir: boolean
  lang: boolean
  seo: boolean | SeoAttributesOptions | undefined
  baseUrl: string
  locales: HeadLocale[]
  defaultLocale: string | undefined
  hreflangLinks: boolean
  strictCanonicals: boolean
  canonicalQueries: string[]
  getCurrentLanguage: () => string | undefined
  getCurrentDirection: () => string
  getRouteBaseName: (route: RouteLocationResolvedGeneric | RouteLocationNormalizedLoadedGeneric) => string | undefined
  getLocaleRoute: (route: RouteLocationResolvedGeneric) => RouteLocationResolvedGeneric | undefined
  getCurrentRoute: () => RouteLocationNormalizedLoadedGeneric
  getRouteWithoutQuery: () => RouteLocationResolvedGeneric | undefined
  getLocalizedRoute: (locale: string, route: RouteLocationResolvedGeneric | undefined) => string
}

const strictSeo = __I18N_STRICT_SEO__

/**
 * @internal
 */
export function localeHead(
  options: HeadContext,
  currentLanguage = options.getCurrentLanguage(),
  currentDirection = options.getCurrentDirection()
): I18nHeadMetaInfo {
  const metaObject: I18nHeadMetaInfo = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  // Adding Direction Attribute
  if (options.dir) {
    metaObject.htmlAttrs.dir = currentDirection
  }

  if (options.lang && currentLanguage) {
    metaObject.htmlAttrs.lang = currentLanguage
  }

  // Adding SEO Meta
  if (options.seo) {
    const alternateLinks = getHreflangLinks(options)
    // prettier-ignore
    metaObject.link = metaObject.link.concat(
      alternateLinks,
      getCanonicalLink(options)
    )

    // prettier-ignore
    metaObject.meta = metaObject.meta.concat(
      getOgUrl(options),
      getCurrentOgLocale(options),
      getAlternateOgLocales(
        options,
        strictSeo
          ? alternateLinks.map(x => x.hreflang).filter(x => x !== 'x-default')
          : options.locales.map(x => x.language || x.code)
      )
    )
  }

  return metaObject
}

/**
 * Create a map of locales for hreflang links
 * to avoid duplicates and handle catchall locales
 */
function createLocaleMap(locales: HeadLocale[]) {
  const localeMap = new Map<string, HeadLocale>()
  for (const locale of locales) {
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
  return localeMap
}

function getHreflangLinks(options: HeadContext) {
  if (!options.hreflangLinks) return []

  const links: MetaAttrs[] = []
  const localeMap = createLocaleMap(options.locales)
  for (const [language, locale] of localeMap.entries()) {
    const link = getHreflangLink(language, locale, options)
    if (!link) continue

    links.push(link)
    if (options.defaultLocale && options.defaultLocale === locale.code && links[0].hreflang !== 'x-default') {
      links.unshift(
        strictSeo
          ? { rel: 'alternate', href: link.href, hreflang: 'x-default' }
          : { [options.key]: 'i18n-xd', rel: 'alternate', href: link.href, hreflang: 'x-default' }
      )
    }
  }

  return links
}

function getHreflangLink(
  language: string,
  locale: HeadLocale,
  options: HeadContext,
  routeWithoutQuery = options.strictCanonicals ? options.getRouteWithoutQuery() : undefined
): MetaAttrs | undefined {
  const localePath = options.getLocalizedRoute(locale.code, routeWithoutQuery)
  if (!localePath) return undefined

  const href = withQuery(
    hasProtocol(localePath) ? localePath : joinURL(options.baseUrl, localePath),
    options.strictCanonicals ? getCanonicalQueryParams(options) : {}
  )
  return strictSeo
    ? { rel: 'alternate', href, hreflang: language }
    : { [options.key]: `i18n-alt-${language}`, rel: 'alternate', href, hreflang: language }
}

function getCanonicalUrl(options: HeadContext, route = options.getCurrentRoute()) {
  const currentRoute = options.getLocaleRoute(
    Object.assign({}, route, { path: undefined, name: options.getRouteBaseName(route) })
  )

  if (!currentRoute) return ''
  return withQuery(joinURL(options.baseUrl, currentRoute.path), getCanonicalQueryParams(options))
}

function getCanonicalLink(options: HeadContext, href = getCanonicalUrl(options)): MetaAttrs[] {
  if (!href) return []
  return [strictSeo ? { rel: 'canonical', href } : { [options.key]: 'i18n-can', rel: 'canonical', href }]
}

function getCanonicalQueryParams(options: HeadContext, route = options.getCurrentRoute()) {
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

function getOgUrl(options: HeadContext, href = getCanonicalUrl(options)): MetaAttrs[] {
  if (!href) return []
  return [
    strictSeo
      ? { property: 'og:url', content: href }
      : { [options.key]: 'i18n-og-url', property: 'og:url', content: href }
  ]
}

function getCurrentOgLocale(options: HeadContext, currentLanguage = options.getCurrentLanguage()): MetaAttrs[] {
  if (!currentLanguage) return []
  return [
    strictSeo
      ? { property: 'og:locale', content: formatOgLanguage(currentLanguage) }
      : { [options.key]: 'i18n-og', property: 'og:locale', content: formatOgLanguage(currentLanguage) }
  ]
}

function getAlternateOgLocales(
  options: HeadContext,
  languages: string[],
  currentLanguage = options.getCurrentLanguage()
): MetaAttrs[] {
  const alternateLocales = languages.filter(locale => locale && locale !== currentLanguage)

  return alternateLocales.map(locale =>
    strictSeo
      ? {
          property: 'og:locale:alternate',
          content: formatOgLanguage(locale)
        }
      : {
          [options.key]: `i18n-og-alt-${locale}`,
          property: 'og:locale:alternate',
          content: formatOgLanguage(locale)
        }
  )
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

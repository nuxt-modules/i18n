import { withBase, withQuery } from 'ufo'

import type { QueryValue } from 'ufo'
import type { RouteLocationNormalizedLoadedGeneric, RouteLocationResolvedGeneric } from 'vue-router'
import type { HeadLocale } from './types'
import type { AlternateLanguageLink, CanonicalLink, HtmlAttributes, PropertyMeta } from 'unhead/types'

/**
 * I18n header meta info.
 * @internal
 */
export interface I18nHeadMetaInfo {
  htmlAttrs: Pick<HtmlAttributes, 'lang' | 'dir'>
  meta: PropertyMeta[]
  link: (AlternateLanguageLink | CanonicalLink)[]
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
  strictSeo: boolean
  dir: boolean
  lang: boolean
  seo: boolean | SeoAttributesOptions | undefined
  baseUrl: string
  locales: HeadLocale[]
  currentLocale: string
  defaultLocale: string | undefined
  hreflangLinks: boolean
  strictCanonicals: boolean
  canonicalQueries: string[]
  getCurrentLanguage: () => string | undefined
  getCurrentDirection: () => 'ltr' | 'rtl' | 'auto'
  getRouteBaseName: (route: RouteLocationResolvedGeneric | RouteLocationNormalizedLoadedGeneric) => string | undefined
  getLocaleRoute: (route: RouteLocationResolvedGeneric) => RouteLocationResolvedGeneric | undefined
  getCurrentRoute: () => RouteLocationNormalizedLoadedGeneric
  getRouteWithoutQuery: () => RouteLocationResolvedGeneric | undefined
  getLocalizedRoute: (locale: string, route: RouteLocationResolvedGeneric | undefined) => string
}

/**
 * @internal
 */
export function localeHead(
  options: HeadContext,
  currentLanguage = options.getCurrentLanguage(),
  currentDirection = options.getCurrentDirection(),
): I18nHeadMetaInfo {
  const metaObject: I18nHeadMetaInfo = {
    htmlAttrs: {},
    link: [],
    meta: [],
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
    const routeWithoutQuery = options.strictCanonicals ? options.getRouteWithoutQuery() : undefined
    const alternateLinks = getHreflangLinks(options, routeWithoutQuery)
    // `og:url` is the canonical by definition, resolving it twice lets the two disagree
    const canonical = getCanonicalUrl(options, routeWithoutQuery)
    metaObject.link = metaObject.link.concat(
      alternateLinks,
      getCanonicalLink(options, canonical),
    )

    metaObject.meta = metaObject.meta.concat(
      getOgUrl(options, canonical),
      getCurrentOgLocale(options),
      getAlternateOgLocales(options, getAlternateOgLanguages(options, alternateLinks)),
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

function getHreflangLinks(
  options: HeadContext,
  routeWithoutQuery = options.strictCanonicals ? options.getRouteWithoutQuery() : undefined,
) {
  if (!options.hreflangLinks) { return [] }

  const links: AlternateLanguageLink[] = []
  const localeMap = createLocaleMap(options.locales)
  // a region-tagged locale holds two entries (`en` and `en-US`) resolving to the same href
  const hrefs = new Map<string, string>()
  for (const [language, locale] of localeMap.entries()) {
    const href = hrefs.get(locale.code) ?? resolveAlternateHref(locale.code, options, routeWithoutQuery)
    if (!href) { continue }
    hrefs.set(locale.code, href)

    const link: AlternateLanguageLink = options.strictSeo
      ? { rel: 'alternate', href, hreflang: language }
      : { [options.key]: `i18n-alt-${language}`, rel: 'alternate', href, hreflang: language }

    links.push(link)
    if (options.defaultLocale && options.defaultLocale === locale.code && links[0]!.hreflang !== 'x-default') {
      links.unshift(
        options.strictSeo
          ? { rel: 'alternate', href, hreflang: 'x-default' }
          : { [options.key]: 'i18n-xd', rel: 'alternate', href, hreflang: 'x-default' },
      )
    }
  }

  return links
}

function resolveAlternateHref(
  locale: string,
  options: HeadContext,
  routeWithoutQuery = options.strictCanonicals ? options.getRouteWithoutQuery() : undefined,
): string | undefined {
  const localePath = options.getLocalizedRoute(locale, routeWithoutQuery)
  if (!localePath) { return undefined }

  return withQuery(
    withBase(localePath, options.baseUrl),
    options.strictCanonicals ? getCanonicalQueryParams(options) : {},
  )
}

/** the current locale's own alternate, so the canonical is always a member of the set it ships with */
function getCanonicalUrl(
  options: HeadContext,
  routeWithoutQuery = options.strictCanonicals ? options.getRouteWithoutQuery() : undefined,
) {
  const localePath = options.getLocalizedRoute(options.currentLocale, routeWithoutQuery)
  if (!localePath) { return '' }
  return withQuery(withBase(localePath, options.baseUrl), getCanonicalQueryParams(options))
}

function getCanonicalLink(options: HeadContext, href = getCanonicalUrl(options)): CanonicalLink[] {
  if (!href) { return [] }
  return [options.strictSeo ? { rel: 'canonical', href } : { [options.key]: 'i18n-can', rel: 'canonical', href }]
}

function getCanonicalQueryParams(options: HeadContext, route = options.getCurrentRoute()) {
  if (!options.canonicalQueries.length) { return {} }

  const currentRoute = options.getLocaleRoute(
    Object.assign({}, route, { path: undefined, name: options.getRouteBaseName(route) }),
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

function getOgUrl(options: HeadContext, href = getCanonicalUrl(options)): PropertyMeta[] {
  if (!href) { return [] }
  return [
    options.strictSeo
      ? { property: 'og:url', content: href }
      : { [options.key]: 'i18n-og-url', property: 'og:url', content: href },
  ]
}

function getCurrentOgLocale(options: HeadContext, currentLanguage = options.getCurrentLanguage()): PropertyMeta[] {
  if (!currentLanguage) { return [] }
  return [
    options.strictSeo
      ? { property: 'og:locale', content: formatOgLanguage(currentLanguage) }
      : { [options.key]: 'i18n-og', property: 'og:locale', content: formatOgLanguage(currentLanguage) },
  ]
}

/**
 * The hreflang list contains bare-language catchall entries which are not valid `og:locale` values,
 * limit to the locales' own `language` tags while keeping the availability filtering of the links.
 */
function getAlternateOgLanguages(options: HeadContext, alternateLinks: AlternateLanguageLink[]): string[] {
  const languages = options.locales.map(x => x.language || x.code)
  if (!options.strictSeo) {
    return languages
  }
  const available = new Set(alternateLinks.map(x => x.hreflang))
  return languages.filter(x => available.has(x))
}

function getAlternateOgLocales(
  options: HeadContext,
  languages: string[],
  currentLanguage = options.getCurrentLanguage(),
): PropertyMeta[] {
  const alternateLocales = languages.filter(locale => locale && locale !== currentLanguage)

  return alternateLocales.map(locale =>
    options.strictSeo
      ? {
          property: 'og:locale:alternate',
          content: formatOgLanguage(locale),
        }
      : {
          [options.key]: `i18n-og-alt-${locale}`,
          property: 'og:locale:alternate',
          content: formatOgLanguage(locale),
        },
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

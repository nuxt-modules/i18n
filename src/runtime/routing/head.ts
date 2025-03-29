import { joinURL, withQuery, type QueryValue } from 'ufo'
import { unref, useNuxtApp, useRuntimeConfig } from '#imports'
import { assign, isObject } from '@intlify/shared'

import { getNormalizedLocales } from './utils'
import { getRouteBaseName, localeRoute, switchLocalePath } from './routing'
import { getComposer } from '../compatibility'
import { toArray } from '../utils'

import type {
  I18nHeadMetaInfo,
  MetaAttrs,
  LocaleObject,
  I18nHeadOptions,
  SeoAttributesOptions
} from '#internal-i18n-types'
import type { CommonComposableOptions } from '../utils'

type HeadContext = {
  key: string
  seo: boolean | SeoAttributesOptions | undefined
  currentDir: string
  currentLocale: LocaleObject<string>
  currentLanguage: string | undefined
  baseUrl: string
  locale: string
  locales: LocaleObject<string>[]
}

export function creatHeadContext({ key, seo }: Required<Pick<I18nHeadOptions, 'key' | 'seo'>>): HeadContext {
  const nuxtApp = useNuxtApp()
  const { defaultDirection } = useRuntimeConfig().public.i18n
  const locale = unref(nuxtApp.$i18n.locale)
  const locales = getNormalizedLocales(unref(nuxtApp.$i18n.locales))
  const currentLocale: LocaleObject = locales.find(l => l.code === locale) || { code: locale }
  const baseUrl = joinURL(unref(getComposer(nuxtApp.$i18n).baseUrl), nuxtApp.$config.app.baseURL)
  return {
    key,
    seo,
    locale,
    locales,
    currentDir: currentLocale.dir || defaultDirection,
    currentLocale,
    currentLanguage: currentLocale.language,
    baseUrl
  }
}

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param common - Common options used internally by composable functions.
 * @param options - An options, see about details {@link I18nHeadOptions}.
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties}.
 *
 * @public
 */
export function localeHead(
  common: CommonComposableOptions,
  { dir = true, lang = true, seo = true, key = 'hid' }: I18nHeadOptions
): I18nHeadMetaInfo {
  const metaObject: I18nHeadMetaInfo = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  const ctx = creatHeadContext({ seo, key })
  if (!ctx.baseUrl) {
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  // skip if no locales or baseUrl is set
  if (ctx.locales == null || ctx.baseUrl == null) {
    return metaObject
  }

  // Adding Direction Attribute
  if (dir) {
    metaObject.htmlAttrs.dir = ctx.currentDir
  }

  if (lang && ctx.currentLanguage) {
    metaObject.htmlAttrs.lang = ctx.currentLanguage
  }

  // Adding SEO Meta
  if (seo && ctx.locale && ctx.locales) {
    // prettier-ignore
    metaObject.link = metaObject.link.concat(
      getHreflangLinks(common, ctx),
      getCanonicalLink(common, ctx))

    // prettier-ignore
    metaObject.meta = metaObject.meta.concat(
      getOgUrl(common, ctx),
      getCurrentOgLocale(ctx),
      getAlternateOgLocales(ctx)
    )
  }

  return metaObject
}

export function getHreflangLinks(common: CommonComposableOptions, ctx: HeadContext) {
  const { defaultLocale, strategy } = useRuntimeConfig().public.i18n
  const links: MetaAttrs[] = []

  if (strategy === 'no_prefix') return links

  const localeMap = new Map<string, LocaleObject>()
  for (const locale of ctx.locales) {
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

  const strictCanonicals = common.runtimeConfig.public.i18n.experimental.alternateLinkCanonicalQueries === true
  const routeWithoutQuery = strictCanonicals ? common.router.resolve({ query: {} }) : undefined

  // set meta property which is lost on router.resolve
  if (!common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR && strictCanonicals) {
    routeWithoutQuery!.meta = common.router.currentRoute.value.meta
  }

  for (const [language, mapLocale] of localeMap.entries()) {
    const localePath = switchLocalePath(common, mapLocale.code, routeWithoutQuery)
    if (!localePath) continue

    const href = withQuery(
      joinURL(ctx.baseUrl, localePath),
      strictCanonicals ? getCanonicalQueryParams(common, ctx) : {}
    )

    links.push({ [ctx.key]: `i18n-alt-${language}`, rel: 'alternate', href, hreflang: language })
    if (defaultLocale && defaultLocale === mapLocale.code) {
      links.unshift({ [ctx.key]: 'i18n-xd', rel: 'alternate', href, hreflang: 'x-default' })
    }
  }

  return links
}

function getCanonicalUrl(common: CommonComposableOptions, ctx: HeadContext) {
  const route = common.router.currentRoute.value
  const currentRoute = localeRoute(
    common,
    assign({}, route, { path: undefined, name: getRouteBaseName(common, route) })
  )

  if (!currentRoute) return ''

  return withQuery(joinURL(ctx.baseUrl, currentRoute.path), getCanonicalQueryParams(common, ctx))
}

export function getCanonicalLink(common: CommonComposableOptions, ctx: HeadContext): MetaAttrs[] {
  const href = getCanonicalUrl(common, ctx)
  if (!href) return []

  return [{ [ctx.key]: 'i18n-can', rel: 'canonical', href }]
}

function getCanonicalQueryParams(common: CommonComposableOptions, ctx: HeadContext) {
  const route = common.router.currentRoute.value
  const currentRoute = localeRoute(
    common,
    assign({}, route, { path: undefined, name: getRouteBaseName(common, route) })
  )

  const canonicalQueries = (isObject(ctx.seo) && ctx.seo?.canonicalQueries) || []
  const currentRouteQuery = currentRoute?.query || {}
  const params: Record<string, QueryValue[]> = {}
  for (const param of canonicalQueries.filter(x => x in currentRouteQuery)) {
    params[param] ??= []
    for (const val of toArray(currentRouteQuery[param])) {
      params[param].push(val || '')
    }
  }

  return params
}

export function getOgUrl(common: CommonComposableOptions, ctx: HeadContext): MetaAttrs[] {
  const href = getCanonicalUrl(common, ctx)
  if (!href) return []
  return [{ [ctx.key]: 'i18n-og-url', property: 'og:url', content: href }]
}

export function getCurrentOgLocale(ctx: HeadContext): MetaAttrs[] {
  if (!ctx.currentLanguage) return []
  // Replace dash with underscore as defined in spec: language_TERRITORY
  return [{ [ctx.key]: 'i18n-og', property: 'og:locale', content: hyphenToUnderscore(ctx.currentLanguage) }]
}

export function getAlternateOgLocales(ctx: HeadContext): MetaAttrs[] {
  const alternateLocales = ctx.locales.filter(locale => locale.language && locale.language !== ctx.currentLanguage)

  return alternateLocales.map(locale => ({
    [ctx.key]: `i18n-og-alt-${locale.language}`,
    property: 'og:locale:alternate',
    content: hyphenToUnderscore(locale.language)
  }))
}

function hyphenToUnderscore(val: string = '') {
  return val.replace(/-/g, '_')
}

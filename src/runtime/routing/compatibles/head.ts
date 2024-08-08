import { joinURL } from 'ufo'
import { isArray, isObject } from '@intlify/shared'
import { unref, useNuxtApp, useRuntimeConfig } from '#imports'

import { getNormalizedLocales } from '../utils'
import { getRouteBaseName, localeRoute, switchLocalePath } from './routing'
import { getComposer, getLocale, getLocales } from '../../compatibility'

import type { I18n } from 'vue-i18n'
import type { I18nHeadMetaInfo, MetaAttrs, LocaleObject, I18nHeadOptions } from '#build/i18n.options.mjs'
import type { CommonComposableOptions } from '../../utils'

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An options, see about details {@link I18nHeadOptions}.
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties}.
 *
 * @public
 */
export function localeHead(
  common: CommonComposableOptions,
  {
    addDirAttribute = false,
    addSeoAttributes: seoAttributes = true,
    identifierAttribute: idAttribute = 'hid'
  }: I18nHeadOptions
): I18nHeadMetaInfo {
  const { defaultDirection } = useRuntimeConfig().public.i18n
  const i18n = getComposer(common.i18n)

  const metaObject: Required<I18nHeadMetaInfo> = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  if (unref(i18n.locales) == null || unref(i18n.baseUrl) == null) {
    return metaObject
  }

  const locale = getLocale(common.i18n)
  const locales = getLocales(common.i18n)
  const currentLocale = getNormalizedLocales(locales).find(l => l.code === locale) || {
    code: locale
  }
  const currentLanguage = currentLocale.language
  const currentDir = currentLocale.dir || defaultDirection

  // Adding Direction Attribute
  if (addDirAttribute) {
    metaObject.htmlAttrs.dir = currentDir
  }

  // Adding SEO Meta
  if (seoAttributes && locale && unref(i18n.locales)) {
    if (currentLanguage) {
      metaObject.htmlAttrs.lang = currentLanguage
    }

    metaObject.link.push(
      ...getHreflangLinks(common, unref(locales) as LocaleObject[], idAttribute),
      ...getCanonicalLink(common, idAttribute, seoAttributes)
    )

    metaObject.meta.push(
      ...getOgUrl(common, idAttribute, seoAttributes),
      ...getCurrentOgLocale(currentLocale, currentLanguage, idAttribute),
      ...getAlternateOgLocales(unref(locales) as LocaleObject[], currentLanguage, idAttribute)
    )
  }

  return metaObject
}

function getBaseUrl() {
  const nuxtApp = useNuxtApp()
  const i18n = getComposer(nuxtApp.$i18n as I18n)
  return joinURL(unref(i18n.baseUrl), nuxtApp.$config.app.baseURL)
}

export function getHreflangLinks(
  common: CommonComposableOptions,
  locales: LocaleObject[],
  idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>
) {
  const baseUrl = getBaseUrl()
  const { defaultLocale, strategy } = useRuntimeConfig().public.i18n
  const links: MetaAttrs[] = []

  if (strategy === 'no_prefix') return links

  const localeMap = new Map<string, LocaleObject>()
  for (const locale of locales) {
    const localeLanguage = locale.language

    if (!localeLanguage) {
      console.warn('Locale ISO code is required to generate alternate link')
      continue
    }

    const [language, region] = localeLanguage.split('-')
    if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
      localeMap.set(language, locale)
    }

    localeMap.set(localeLanguage, locale)
  }

  for (const [iso, mapLocale] of localeMap.entries()) {
    const localePath = switchLocalePath(common, mapLocale.code)
    if (localePath) {
      links.push({
        [idAttribute]: `i18n-alt-${iso}`,
        rel: 'alternate',
        href: toAbsoluteUrl(localePath, baseUrl),
        hreflang: iso
      })
    }
  }

  if (defaultLocale) {
    const localePath = switchLocalePath(common, defaultLocale)
    if (localePath) {
      links.push({
        [idAttribute]: 'i18n-xd',
        rel: 'alternate',
        href: toAbsoluteUrl(localePath, baseUrl),
        hreflang: 'x-default'
      })
    }
  }

  return links
}

export function getCanonicalUrl(
  common: CommonComposableOptions,
  baseUrl: string,
  seoAttributes: I18nHeadOptions['addSeoAttributes']
) {
  const route = common.router.currentRoute.value
  const currentRoute = localeRoute(common, {
    ...route,
    path: undefined,
    name: getRouteBaseName(common, route)
  })

  if (!currentRoute) return ''
  let href = toAbsoluteUrl(currentRoute.path, baseUrl)

  const canonicalQueries = (isObject(seoAttributes) && seoAttributes.canonicalQueries) || []
  const currentRouteQueryParams = currentRoute.query
  const params = new URLSearchParams()
  for (const queryParamName of canonicalQueries) {
    if (queryParamName in currentRouteQueryParams) {
      const queryParamValue = currentRouteQueryParams[queryParamName]

      if (isArray(queryParamValue)) {
        queryParamValue.forEach(v => params.append(queryParamName, v || ''))
      } else {
        params.append(queryParamName, queryParamValue || '')
      }
    }
  }

  const queryString = params.toString()
  if (queryString) {
    href = `${href}?${queryString}`
  }

  return href
}

export function getCanonicalLink(
  common: CommonComposableOptions,
  idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>,
  seoAttributes: I18nHeadOptions['addSeoAttributes']
) {
  const baseUrl = getBaseUrl()
  const href = getCanonicalUrl(common, baseUrl, seoAttributes)
  if (!href) return []

  return [{ [idAttribute]: 'i18n-can', rel: 'canonical', href }]
}

export function getOgUrl(
  common: CommonComposableOptions,
  idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>,
  seoAttributes: I18nHeadOptions['addSeoAttributes']
) {
  const baseUrl = getBaseUrl()
  const href = getCanonicalUrl(common, baseUrl, seoAttributes)
  if (!href) return []

  return [{ [idAttribute]: 'i18n-og-url', property: 'og:url', content: href }]
}

export function getCurrentOgLocale(
  currentLocale: LocaleObject,
  currentIso: string | undefined,
  idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>
) {
  if (!currentLocale || !currentIso) return []

  // Replace dash with underscore as defined in spec: language_TERRITORY
  return [{ [idAttribute]: 'i18n-og', property: 'og:locale', content: hypenToUnderscore(currentIso) }]
}

export function getAlternateOgLocales(
  locales: LocaleObject[],
  currentIso: string | undefined,
  idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>
) {
  const alternateLocales = locales.filter(locale => locale.language && locale.language !== currentIso)

  return alternateLocales.map(locale => ({
    [idAttribute]: `i18n-og-alt-${locale.language}`,
    property: 'og:locale:alternate',
    content: hypenToUnderscore(locale.language!)
  }))
}

function hypenToUnderscore(str: string) {
  return (str || '').replace(/-/g, '_')
}

function toAbsoluteUrl(urlOrPath: string, baseUrl: string) {
  if (urlOrPath.match(/^https?:\/\//)) return urlOrPath
  return joinURL(baseUrl, urlOrPath)
}

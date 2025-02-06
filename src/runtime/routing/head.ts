import { joinURL } from 'ufo'
import { isArray, isObject } from '@intlify/shared'
import { unref, useNuxtApp, useRuntimeConfig } from '#imports'

import { getNormalizedLocales } from './utils'
import { getRouteBaseName, localeRoute, switchLocalePath } from './routing'
import { getComposer } from '../compatibility'

import type { I18n } from 'vue-i18n'
import type { I18nHeadMetaInfo, MetaAttrs, LocaleObject, I18nHeadOptions } from '#internal-i18n-types'
import type { CommonComposableOptions } from '../utils'

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
  const { defaultDirection } = useRuntimeConfig().public.i18n
  const nuxtApp = useNuxtApp()

  const metaObject: Required<I18nHeadMetaInfo> = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  const i18nBaseUrl = unref(nuxtApp.$i18n.baseUrl)
  if (!i18nBaseUrl) {
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  // skip if no locales or baseUrl is set
  if (unref(nuxtApp.$i18n.locales) == null || i18nBaseUrl == null) {
    return metaObject
  }

  const locale = unref(nuxtApp.$i18n.locale)
  const locales = unref(nuxtApp.$i18n.locales)
  const currentLocale: LocaleObject = getNormalizedLocales(locales).find(l => l.code === locale) || {
    code: locale
  }
  const currentLanguage = currentLocale.language
  const currentDir = currentLocale.dir || defaultDirection

  // Adding Direction Attribute
  if (dir) {
    metaObject.htmlAttrs.dir = currentDir
  }

  if (lang && currentLanguage) {
    metaObject.htmlAttrs.lang = currentLanguage
  }

  // Adding SEO Meta
  if (seo && locale && unref(nuxtApp.$i18n.locales)) {
    metaObject.link.push(...getHreflangLinks(common, locales, key, seo), ...getCanonicalLink(common, key, seo))

    metaObject.meta.push(
      ...getOgUrl(common, key, seo),
      ...getCurrentOgLocale(currentLocale, currentLanguage, key),
      ...getAlternateOgLocales(locales, currentLanguage, key)
    )
  }

  return metaObject
}

function getBaseUrl() {
  const nuxtApp = useNuxtApp()
  const i18n = getComposer(nuxtApp.$i18n as unknown as I18n)
  return joinURL(unref(i18n.baseUrl), nuxtApp.$config.app.baseURL)
}

export function getHreflangLinks(
  common: CommonComposableOptions,
  locales: LocaleObject[],
  key: NonNullable<I18nHeadOptions['key']>,
  seo: I18nHeadOptions['seo']
) {
  const baseUrl = getBaseUrl()
  const { defaultLocale, strategy } = useRuntimeConfig().public.i18n
  const links: MetaAttrs[] = []

  if (strategy === 'no_prefix') return links

  const localeMap = new Map<string, LocaleObject>()
  for (const locale of locales) {
    const localeLanguage = locale.language

    if (!localeLanguage) {
      console.warn('Locale `language` ISO code is required to generate alternate link')
      continue
    }

    const [language, region] = localeLanguage.split('-')
    if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
      localeMap.set(language, locale)
    }

    localeMap.set(localeLanguage, locale)
  }

  const strictCanonicals = common.runtimeConfig.public.i18n.experimental.alternateLinkCanonicalQueries === true
  const routeWithoutQuery = strictCanonicals ? common.router.resolve({ query: {} }) : undefined

  // set meta property which is lost on router.resolve
  if (!common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR && strictCanonicals) {
    routeWithoutQuery!.meta = common.router.currentRoute.value.meta
  }

  for (const [language, mapLocale] of localeMap.entries()) {
    const localePath = switchLocalePath(common, mapLocale.code, routeWithoutQuery)
    const canonicalQueryParams = getCanonicalQueryParams(common, seo)
    let href = toAbsoluteUrl(localePath, baseUrl)
    if (canonicalQueryParams && strictCanonicals) {
      href = `${href}?${canonicalQueryParams}`
    }

    if (localePath) {
      links.push({
        [key]: `i18n-alt-${language}`,
        rel: 'alternate',
        href: href,
        hreflang: language
      })
    }
  }

  if (defaultLocale) {
    const localePath = switchLocalePath(common, defaultLocale, routeWithoutQuery)
    const canonicalQueryParams = getCanonicalQueryParams(common, seo)
    let href = toAbsoluteUrl(localePath, baseUrl)
    if (canonicalQueryParams && strictCanonicals) {
      href = `${href}?${canonicalQueryParams}`
    }

    if (localePath) {
      links.push({
        [key]: 'i18n-xd',
        rel: 'alternate',
        href: href,
        hreflang: 'x-default'
      })
    }
  }

  return links
}

export function getCanonicalUrl(common: CommonComposableOptions, baseUrl: string, seo: I18nHeadOptions['seo']) {
  const route = common.router.currentRoute.value
  const currentRoute = localeRoute(common, {
    ...route,
    path: undefined,
    name: getRouteBaseName(common, route)
  })

  if (!currentRoute) return ''
  let href = toAbsoluteUrl(currentRoute.path, baseUrl)

  const canonicalQueryParams = getCanonicalQueryParams(common, seo)
  if (canonicalQueryParams) {
    href = `${href}?${canonicalQueryParams}`
  }

  return href
}

export function getCanonicalLink(
  common: CommonComposableOptions,
  key: NonNullable<I18nHeadOptions['key']>,
  seo: I18nHeadOptions['seo']
) {
  const baseUrl = getBaseUrl()
  const href = getCanonicalUrl(common, baseUrl, seo)
  if (!href) return []

  return [{ [key]: 'i18n-can', rel: 'canonical', href }]
}

export function getCanonicalQueryParams(common: CommonComposableOptions, seo: I18nHeadOptions['seo']) {
  const route = common.router.currentRoute.value
  const currentRoute = localeRoute(common, {
    ...route,
    path: undefined,
    name: getRouteBaseName(common, route)
  })

  const canonicalQueries = (isObject(seo) && seo.canonicalQueries) || []
  const currentRouteQueryParams = currentRoute?.query || {}
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

  return params.toString() || undefined
}

export function getOgUrl(
  common: CommonComposableOptions,
  key: NonNullable<I18nHeadOptions['key']>,
  seo: I18nHeadOptions['seo']
) {
  const baseUrl = getBaseUrl()
  const href = getCanonicalUrl(common, baseUrl, seo)
  if (!href) return []

  return [{ [key]: 'i18n-og-url', property: 'og:url', content: href }]
}

export function getCurrentOgLocale(
  currentLocale: LocaleObject,
  currentLanguage: string | undefined,
  key: NonNullable<I18nHeadOptions['key']>
) {
  if (!currentLocale || !currentLanguage) return []

  // Replace dash with underscore as defined in spec: language_TERRITORY
  return [{ [key]: 'i18n-og', property: 'og:locale', content: hyphenToUnderscore(currentLanguage) }]
}

export function getAlternateOgLocales(
  locales: LocaleObject[],
  currentLanguage: string | undefined,
  key: NonNullable<I18nHeadOptions['key']>
) {
  const alternateLocales = locales.filter(locale => locale.language && locale.language !== currentLanguage)

  return alternateLocales.map(locale => ({
    [key]: `i18n-og-alt-${locale.language}`,
    property: 'og:locale:alternate',
    content: hyphenToUnderscore(locale.language)
  }))
}

function hyphenToUnderscore(str?: string) {
  return (str || '').replace(/-/g, '_')
}

function toAbsoluteUrl(urlOrPath: string, baseUrl: string) {
  if (urlOrPath.match(/^https?:\/\//)) return urlOrPath
  return joinURL(baseUrl, urlOrPath)
}

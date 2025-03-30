import { joinURL, withQuery, type QueryValue } from 'ufo'
import { computed, getCurrentScope, onScopeDispose, ref, unref, useHead, useNuxtApp, watch, type Ref } from '#imports'
import { assign, isObject } from '@intlify/shared'

import { getNormalizedLocales } from './utils'
import { getRouteBaseName, localeRoute, switchLocalePath } from './routing'
import { getComposer } from '../compatibility'
import { toArray } from '../utils'
import { DEFAULT_DYNAMIC_PARAMS_KEY } from '#build/i18n.options.mjs'

import type {
  I18nHeadMetaInfo,
  MetaAttrs,
  LocaleObject,
  I18nHeadOptions,
  SeoAttributesOptions,
  I18nPublicRuntimeConfig
} from '#internal-i18n-types'
import type { CommonComposableOptions } from '../utils'
import type { I18nRouteMeta } from '../types'

type HeadContext = {
  key: string
  dir: boolean
  lang: boolean
  seo: boolean | SeoAttributesOptions | undefined
  currentDir: string
  currentLocale: LocaleObject<string>
  currentLanguage: string | undefined
  baseUrl: string
  locale: string
  locales: LocaleObject<string>[]
  runtimeI18n: I18nPublicRuntimeConfig
}

function createHeadContext(options: Required<I18nHeadOptions>): HeadContext {
  const nuxtApp = useNuxtApp()
  const locale = unref(nuxtApp.$i18n.locale)
  const locales = getNormalizedLocales(unref(nuxtApp.$i18n.locales))
  const currentLocale: LocaleObject = locales.find(l => l.code === locale) || { code: locale }
  const baseUrl = joinURL(unref(getComposer(nuxtApp.$i18n).baseUrl), nuxtApp.$config.app.baseURL)
  const runtimeI18n = nuxtApp.$config.public.i18n as I18nPublicRuntimeConfig

  if (!baseUrl) {
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  return {
    dir: options.dir,
    lang: options.lang,
    key: options.key,
    seo: options.seo,
    locale,
    locales,
    currentDir: currentLocale.dir || runtimeI18n.defaultDirection,
    currentLocale,
    currentLanguage: currentLocale.language,
    baseUrl,
    runtimeI18n
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
  return _localeHead(common, { dir, lang, seo, key })
}

export function _useLocaleHead(
  common: CommonComposableOptions,
  { dir = true, lang = true, seo = true, key = 'hid' }: I18nHeadOptions = {}
): Ref<I18nHeadMetaInfo> {
  const ctxOptions = { dir, lang, seo, key }
  const metaObject = ref(_localeHead(common, ctxOptions))

  if (import.meta.client) {
    const i18n = getComposer(common.i18n)
    const unsub = watch(
      [() => common.router.currentRoute.value, i18n.locale],
      () => (metaObject.value = _localeHead(common, ctxOptions))
    )
    if (getCurrentScope()) {
      onScopeDispose(unsub)
    }
  }

  return metaObject
}

export function _useSetI18nParams(
  common: CommonComposableOptions,
  seo?: SeoAttributesOptions
): (params: I18nRouteMeta) => void {
  const head = useHead({})
  const router = common.router
  const experimentalSSR = common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR

  const _i18nParams = ref({})
  const i18nParams = computed({
    get() {
      return experimentalSSR
        ? common.metaState.value
        : (router.currentRoute.value.meta[DEFAULT_DYNAMIC_PARAMS_KEY] ?? {})
    },
    set(val: I18nRouteMeta) {
      common.metaState.value = val
      _i18nParams.value = val
      router.currentRoute.value.meta[DEFAULT_DYNAMIC_PARAMS_KEY] = val
    }
  })

  const unsub = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta[DEFAULT_DYNAMIC_PARAMS_KEY] = experimentalSSR
        ? common.metaState.value
        : _i18nParams.value
    }
  )

  if (getCurrentScope()) {
    onScopeDispose(unsub)
  }

  // Hard code to 'id', this is used to replace payload before ssr response, skip setting `dir`, `lang` when setting i18n params
  const ctxOptions = { dir: false, lang: false, key: 'id', seo: seo ?? true }

  return function (params: I18nRouteMeta) {
    i18nParams.value = { ...params }

    const { link, meta } = _localeHead(common, ctxOptions)
    head?.patch({ link, meta })
  }
}

function _localeHead(common: CommonComposableOptions, options: Required<I18nHeadOptions>): I18nHeadMetaInfo {
  const metaObject: I18nHeadMetaInfo = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  const ctx = createHeadContext(options)

  // Skip if no baseUrl is set
  if (ctx.baseUrl == null) {
    return metaObject
  }

  // Adding Direction Attribute
  if (ctx.dir) {
    metaObject.htmlAttrs.dir = ctx.currentDir
  }

  if (ctx.lang && ctx.currentLanguage) {
    metaObject.htmlAttrs.lang = ctx.currentLanguage
  }

  // Adding SEO Meta
  if (ctx.seo) {
    // prettier-ignore
    metaObject.link = metaObject.link.concat(
      getHreflangLinks(common, ctx),
      getCanonicalLink(common, ctx)
    )

    // prettier-ignore
    metaObject.meta = metaObject.meta.concat(
      getOgUrl(common, ctx),
      getCurrentOgLocale(ctx),
      getAlternateOgLocales(ctx)
    )
  }

  return metaObject
}

function getHreflangLinks(common: CommonComposableOptions, ctx: HeadContext) {
  const { defaultLocale, strategy } = ctx.runtimeI18n
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

  const strictCanonicals = ctx.runtimeI18n.experimental.alternateLinkCanonicalQueries === true
  const routeWithoutQuery = strictCanonicals ? common.router.resolve({ query: {} }) : undefined

  // set meta property which is lost on router.resolve
  if (!ctx.runtimeI18n.experimental.switchLocalePathLinkSSR && strictCanonicals) {
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

function getCanonicalLink(common: CommonComposableOptions, ctx: HeadContext): MetaAttrs[] {
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

function getOgUrl(common: CommonComposableOptions, ctx: HeadContext): MetaAttrs[] {
  const href = getCanonicalUrl(common, ctx)
  if (!href) return []
  return [{ [ctx.key]: 'i18n-og-url', property: 'og:url', content: href }]
}

function getCurrentOgLocale(ctx: HeadContext): MetaAttrs[] {
  if (!ctx.currentLanguage) return []
  // Replace dash with underscore as defined in spec: language_TERRITORY
  return [{ [ctx.key]: 'i18n-og', property: 'og:locale', content: hyphenToUnderscore(ctx.currentLanguage) }]
}

function getAlternateOgLocales(ctx: HeadContext): MetaAttrs[] {
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

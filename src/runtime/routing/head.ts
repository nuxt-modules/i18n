import { computed, getCurrentScope, onScopeDispose, ref, useHead, watch, type Ref } from '#imports'
import { assign } from '@intlify/shared'

import { localeHead as _localeHead, type HeadOptions } from '#i18n-kit/head'
import { DYNAMIC_PARAMS_KEY } from '#build/i18n.options.mjs'

import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#internal-i18n-types'
import type { CommonComposableOptions } from '../utils'
import type { I18nRouteMeta } from '../types'
import { localeRoute, switchLocalePath } from './routing'

function createHeadOptions(
  common: CommonComposableOptions,
  options: Required<I18nHeadOptions>,
  locale = common.getLocale(),
  locales = common.getLocales(),
  baseUrl = common.getBaseUrl(),
  routingOptions = common.getRoutingOptions()
): HeadOptions {
  const currentLocale = locales.find(l => l.code === locale) || { code: locale }
  const canonicalQueries = (typeof options.seo === 'object' && options.seo?.canonicalQueries) || []

  if (!baseUrl) {
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  return {
    dir: options.dir,
    lang: options.lang,
    key: options.key,
    seo: options.seo,
    locales,
    getCurrentLanguage: () => currentLocale.language,
    getCurrentDirection: () => currentLocale.dir || routingOptions.defaultDirection,
    baseUrl,
    hreflangLinks: routingOptions.hreflangLinks,
    defaultLocale: routingOptions.defaultLocale,
    strictCanonicals: routingOptions.strictCanonicals,
    canonicalQueries,
    getLocaleRoute: route => localeRoute(common, route),
    getCurrentRoute: () => common.router.currentRoute.value,
    getRouteBaseName: common.getRouteBaseName,
    getLocalizedRoute: (locale, route) => switchLocalePath(common, locale, route),
    getRouteWithoutQuery: () =>
      assign({}, common.router.resolve({ query: {} }), { meta: common.router.currentRoute.value.meta })
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
  return _localeHead(createHeadOptions(common, { dir, lang, seo, key }))
}

export function _useLocaleHead(
  common: CommonComposableOptions,
  options: Required<I18nHeadOptions>
): Ref<I18nHeadMetaInfo> {
  const metaObject = ref(_localeHead(createHeadOptions(common, options)))

  if (import.meta.client) {
    const unsub = watch(
      [() => common.router.currentRoute.value, () => common.getLocale()],
      () => (metaObject.value = _localeHead(createHeadOptions(common, options)))
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

  const _i18nParams = ref({})
  const i18nParams = computed({
    get() {
      return router.currentRoute.value.meta[DYNAMIC_PARAMS_KEY]
    },
    set(val: I18nRouteMeta) {
      _i18nParams.value = val
      router.currentRoute.value.meta[DYNAMIC_PARAMS_KEY] = val
    }
  })

  const unsub = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta[DYNAMIC_PARAMS_KEY] = _i18nParams.value
    }
  )

  if (getCurrentScope()) {
    onScopeDispose(unsub)
  }

  // Hard code to 'id', this is used to replace payload before ssr response, skip setting `dir`, `lang` when setting i18n params
  const ctxOptions = { dir: false, lang: false, key: 'id', seo: seo ?? true }

  return function (params: I18nRouteMeta) {
    i18nParams.value = { ...params }

    const { link, meta } = _localeHead(createHeadOptions(common, ctxOptions))
    head?.patch({ link, meta })
  }
}

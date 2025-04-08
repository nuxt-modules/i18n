import { computed, getCurrentScope, onScopeDispose, ref, useHead, watch, type Ref } from '#imports'
import { assign } from '@intlify/shared'

import { localeHead as _localeHead, type HeadOptions } from '#i18n-kit/head'
import { DYNAMIC_PARAMS_KEY } from '#build/i18n.options.mjs'

import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#internal-i18n-types'
import type { ComposableContext } from '../utils'
import type { I18nRouteMeta } from '../types'
import { localeRoute, switchLocalePath } from './routing'

function createHeadOptions(
  ctx: ComposableContext,
  options: Required<I18nHeadOptions>,
  locale = ctx.getLocale(),
  locales = ctx.getLocales(),
  baseUrl = ctx.getBaseUrl(),
  routingOptions = ctx.getRoutingOptions()
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
    getLocaleRoute: route => localeRoute(ctx, route),
    getCurrentRoute: () => ctx.router.currentRoute.value,
    getRouteBaseName: ctx.getRouteBaseName,
    getLocalizedRoute: (locale, route) => switchLocalePath(ctx, locale, route),
    getRouteWithoutQuery: () =>
      assign({}, ctx.router.resolve({ query: {} }), { meta: ctx.router.currentRoute.value.meta })
  }
}

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param ctx - Context used internally by composable functions.
 * @param options - An options, see about details {@link I18nHeadOptions}.
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties}.
 *
 * @public
 */
export function localeHead(
  ctx: ComposableContext,
  { dir = true, lang = true, seo = true, key = 'hid' }: I18nHeadOptions
): I18nHeadMetaInfo {
  return _localeHead(createHeadOptions(ctx, { dir, lang, seo, key }))
}

export function _useLocaleHead(common: ComposableContext, options: Required<I18nHeadOptions>): Ref<I18nHeadMetaInfo> {
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
  ctx: ComposableContext,
  seo?: SeoAttributesOptions,
  router = ctx.router
): (params: I18nRouteMeta) => void {
  const head = useHead({})

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

    const { link, meta } = _localeHead(createHeadOptions(ctx, ctxOptions))
    head?.patch({ link, meta })
  }
}

import { computed, getCurrentScope, onScopeDispose, ref, useHead, watch, type Ref } from '#imports'
import { assign } from '@intlify/shared'
import { localeHead as _localeHead, type HeadContext } from '#i18n-kit/head'

import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#internal-i18n-types'
import type { ComposableContext } from '../utils'
import type { I18nRouteMeta } from '../types'
import { localeRoute, switchLocalePath } from './routing'

function createHeadContext(
  ctx: ComposableContext,
  config: Required<I18nHeadOptions>,
  locale = ctx.getLocale(),
  locales = ctx.getLocales(),
  baseUrl = ctx.getBaseUrl(),
  routingOptions = ctx.getRoutingOptions()
): HeadContext {
  const currentLocale = locales.find(l => l.code === locale) || { code: locale }
  const canonicalQueries = (typeof config.seo === 'object' && config.seo?.canonicalQueries) || []

  if (!baseUrl) {
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  return {
    ...config,
    locales,
    baseUrl,
    canonicalQueries,
    hreflangLinks: routingOptions.hreflangLinks,
    defaultLocale: routingOptions.defaultLocale,
    strictCanonicals: routingOptions.strictCanonicals,
    getRouteBaseName: ctx.getRouteBaseName,
    getCurrentRoute: () => ctx.router.currentRoute.value,
    getCurrentLanguage: () => currentLocale.language,
    getCurrentDirection: () => currentLocale.dir || __DEFAULT_DIRECTION__,
    getLocaleRoute: route => localeRoute(ctx, route),
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
  { dir = true, lang = true, seo = true, key = 'key' }: I18nHeadOptions
): I18nHeadMetaInfo {
  return _localeHead(createHeadContext(ctx, { dir, lang, seo, key }))
}

export function _useLocaleHead(ctx: ComposableContext, options: Required<I18nHeadOptions>): Ref<I18nHeadMetaInfo> {
  const metaObject = ref(_localeHead(createHeadContext(ctx, options)))

  if (import.meta.client) {
    const unsub = watch(
      [() => ctx.router.currentRoute.value, () => ctx.getLocale()],
      () => (metaObject.value = _localeHead(createHeadContext(ctx, options)))
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
      return router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__]
    },
    set(val: I18nRouteMeta) {
      _i18nParams.value = val
      router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] = val
    }
  })

  const unsub = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] = _i18nParams.value
    }
  )

  if (getCurrentScope()) {
    onScopeDispose(unsub)
  }

  // Hard code to 'id', this is used to replace payload before ssr response, skip setting `dir`, `lang` when setting i18n params
  const ctxOptions = { dir: false, lang: false, key: 'id', seo: seo ?? true }

  return function (params: I18nRouteMeta) {
    i18nParams.value = { ...params }

    const { link, meta } = _localeHead(createHeadContext(ctx, ctxOptions))
    head?.patch({ link, meta })
  }
}

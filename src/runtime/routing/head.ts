import { computed, getCurrentScope, onScopeDispose, ref, useHead, useRequestEvent, watch, type Ref } from '#imports'
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
  baseUrl = ctx.getBaseUrl()
): HeadContext {
  const currentLocale = locales.find(l => l.code === locale) || { code: locale }
  const canonicalQueries = (typeof config.seo === 'object' && config.seo?.canonicalQueries) || []

  if (!baseUrl) {
    if (__I18N_STRICT_SEO__) {
      throw new Error('I18n `baseUrl` is required to generate valid SEO tag links.')
    }
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  return {
    ...config,
    key: __I18N_STRICT_SEO__ ? 'key' : 'id',
    locales,
    baseUrl,
    canonicalQueries,
    hreflangLinks: ctx.routingOptions.hreflangLinks,
    defaultLocale: ctx.routingOptions.defaultLocale,
    strictCanonicals: __I18N_STRICT_SEO__ || ctx.routingOptions.strictCanonicals,
    getRouteBaseName: ctx.getRouteBaseName,
    getCurrentRoute: () => ctx.router.currentRoute.value,
    getCurrentLanguage: () => currentLocale.language,
    getCurrentDirection: () => currentLocale.dir || __DEFAULT_DIRECTION__,
    getLocaleRoute: route => localeRoute(ctx, route),
    getLocalizedRoute: (locale, route) => switchLocalePath(ctx, locale, route),
    getRouteWithoutQuery: () => {
      try {
        return assign({}, ctx.router.resolve({ query: {} }), { meta: ctx.router.currentRoute.value.meta })
      } catch {
        return undefined
      }
    }
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
  { dir = true, lang = true, seo = true }: I18nHeadOptions
): I18nHeadMetaInfo {
  return _localeHead(createHeadContext(ctx, { dir, lang, seo }))
}

export function _useLocaleHead(ctx: ComposableContext, options: Required<I18nHeadOptions>): Ref<I18nHeadMetaInfo> {
  const metaObject = ref(_localeHead(createHeadContext(ctx, options)))

  if (import.meta.client) {
    const unsub = watch([() => ctx.router.currentRoute.value, () => ctx.getLocale()], () => {
      metaObject.value = _localeHead(createHeadContext(ctx, options))
      __I18N_STRICT_SEO__ && ctx.head?.patch(metaObject.value)
    })
    if (getCurrentScope()) {
      onScopeDispose(unsub)
    }
  }

  __I18N_STRICT_SEO__ && ctx.head?.patch(metaObject.value)

  return metaObject
}

export function _useSetI18nParams(
  ctx: ComposableContext,
  seo?: SeoAttributesOptions,
  router = ctx.router
): (params: I18nRouteMeta) => void {
  const head = __I18N_STRICT_SEO__ ? ctx.head : useHead({})
  const evt = __I18N_STRICT_SEO__ && import.meta.server && useRequestEvent()

  const _i18nParams = ref({})
  const i18nParams = computed({
    get() {
      return router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__]
    },
    set(val: I18nRouteMeta) {
      _i18nParams.value = val
      router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] = val
      if (evt && evt?.context.nuxtI18n?.slp) {
        evt.context.nuxtI18n.slp = val
      }
    }
  })

  const unsub = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] = _i18nParams.value
      __I18N_STRICT_SEO__ && updateState()
    }
  )

  if (getCurrentScope()) {
    onScopeDispose(unsub)
  }

  function updateState() {
    ctx.metaState = _localeHead(createHeadContext(ctx, ctxOptions.value as Required<I18nHeadOptions>))
    head?.patch(ctx.metaState)
  }

  const ctxOptions = ref({
    ...ctx.seoSettings,
    key: __I18N_STRICT_SEO__ ? 'key' : 'id',
    seo: seo ?? ctx.seoSettings.seo
  })

  return function (params: I18nRouteMeta) {
    i18nParams.value = { ...params }
    __I18N_STRICT_SEO__ && updateState()
    if (!__I18N_STRICT_SEO__) {
      const val = _localeHead(createHeadContext(ctx, ctxOptions.value as Required<I18nHeadOptions>))
      head?.patch(val)
    }
  }
}

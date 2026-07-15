import { type Ref, computed, getCurrentScope, onScopeDispose, ref, useHead, useRequestEvent, watch } from '#imports'
import { assign } from '@intlify/shared'
import { type HeadContext, localeHead as _localeHead } from '#i18n-kit/head'

import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#internal-i18n-types'
import type { ComposableContext } from '../composable-context'
import type { I18nRouteMeta } from '../types'
import { localeRoute, switchLocalePath } from './routing'

// unhead v3 narrows head input to per-property unions which the loose public `I18nHeadMetaInfo`
// cannot satisfy, patch through a single boundary cast compatible with both v2 and v3
type HeadEntryInput = Parameters<NonNullable<ComposableContext['head']>['patch']>[0]
function patchHead(head: ComposableContext['head'] | undefined, input: I18nHeadMetaInfo): void {
  head?.patch(input as unknown as HeadEntryInput)
}

function createHeadContext(
  ctx: ComposableContext,
  config: Required<I18nHeadOptions>,
  locale = ctx.getLocale(),
  locales = ctx.getLocales(),
  baseUrl = ctx.getBaseUrl(),
): HeadContext {
  const currentLocale = locales.find(l => l.code === locale) || { code: locale }
  // deduplicate, layered configs merge `canonicalQueries` arrays with duplicate entries
  const canonicalQueries = [...new Set((typeof config.seo === 'object' && config.seo?.canonicalQueries) || [])]

  if (!baseUrl && !ctx.routingOptions.domains) {
    if (ctx.strictSeo) {
      throw new Error('I18n `baseUrl` is required to generate valid SEO tag links.')
    }
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  return {
    ...config,
    key: ctx.strictSeo ? 'key' : 'id',
    strictSeo: ctx.strictSeo,
    locales,
    baseUrl,
    canonicalQueries,
    hreflangLinks: ctx.routingOptions.hreflangLinks,
    defaultLocale: ctx.routingOptions.defaultLocale,
    strictCanonicals: ctx.strictSeo || ctx.routingOptions.strictCanonicals,
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
    },
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
  { dir = true, lang = true, seo = true }: I18nHeadOptions,
): I18nHeadMetaInfo {
  return _localeHead(createHeadContext(ctx, { dir, lang, seo }))
}

export function _useLocaleHead(ctx: ComposableContext, options: Required<I18nHeadOptions>): Ref<I18nHeadMetaInfo> {
  const metaObject = ref(_localeHead(createHeadContext(ctx, options)))

  if (import.meta.client) {
    const unsub = watch([() => ctx.router.currentRoute.value, () => ctx.getLocale()], () => {
      metaObject.value = _localeHead(createHeadContext(ctx, options))
      ctx.strictSeo && patchHead(ctx.head, metaObject.value)
    })
    if (getCurrentScope()) {
      onScopeDispose(unsub)
    }
  }

  ctx.strictSeo && patchHead(ctx.head, metaObject.value)

  return metaObject
}

export function _useSetI18nParams(
  ctx: ComposableContext,
  seo?: SeoAttributesOptions,
  router = ctx.router,
): (params: I18nRouteMeta) => void {
  const head = ctx.strictSeo ? ctx.head : useHead({})
  const evt = ctx.strictSeo && import.meta.server && useRequestEvent()

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
    },
  })

  const unsub = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] = _i18nParams.value
      ctx.strictSeo && updateState()
    },
  )

  if (getCurrentScope()) {
    onScopeDispose(unsub)
  }

  function updateState() {
    ctx.metaState = _localeHead(createHeadContext(ctx, ctxOptions.value as Required<I18nHeadOptions>))
    patchHead(head, ctx.metaState)
  }

  const ctxOptions = ref({
    ...ctx.seoSettings,
    key: ctx.strictSeo ? 'key' : 'id',
    seo: seo ?? ctx.seoSettings.seo,
  })

  return function (params: I18nRouteMeta) {
    i18nParams.value = { ...params }
    ctx.strictSeo && updateState()
    if (!ctx.strictSeo) {
      const val = _localeHead(createHeadContext(ctx, ctxOptions.value as Required<I18nHeadOptions>))
      patchHead(head, val)
    }
  }
}

import { type Ref, computed, getCurrentScope, onScopeDispose, ref, useHead, useRequestEvent, watch } from '#imports'
import { assign } from '@intlify/shared'
import { type HeadContext, localeHead as _localeHead } from '#i18n-kit/head'

import type { I18nHeadMetaInfo, I18nHeadOptions, LocaleObject, SeoAttributesOptions } from '#internal-i18n-types'
import type { ComposableContext } from '../composable-context'
import type { I18nRouteMeta } from '../types'
import { localeRoute, switchLocalePath } from './routing'

function patchHead(head: ComposableContext['head'] | undefined, input: I18nHeadMetaInfo): void {
  head?.patch(input)
}

/**
 * Alternate links annotate the domains as one cluster, and a cluster has a single fallback for
 * unmatched languages. It cannot be resolved from the current domain - every domain would name a
 * different one - so `x-default` is left out until `defaultLocale` names it.
 */
export function missesClusterFallback(ctx: ComposableContext, config: Required<I18nHeadOptions>): boolean {
  const { domains, hreflangLinks, defaultLocale } = ctx.routingOptions
  return !!config.seo && domains && hreflangLinks && !defaultLocale
}

let warnedClusterFallback = false

function createHeadContext(
  ctx: ComposableContext,
  config: Required<I18nHeadOptions>,
  locale = ctx.getLocale(),
  locales = ctx.getLocales(),
  // only reached for a relative path, which under domains means a host matching none of them
  baseUrl = ctx.routingOptions.domains ? ctx.getBaseUrl(locale) : ctx.getBaseUrl(),
): HeadContext {
  const currentLocale: LocaleObject = locales.find(l => l.code === locale) || { code: locale }
  // deduplicate, layered configs merge `canonicalQueries` arrays with duplicate entries
  const canonicalQueries = [...new Set((typeof config.seo === 'object' && config.seo?.canonicalQueries) || [])]

  if (import.meta.dev && !warnedClusterFallback && missesClusterFallback(ctx, config)) {
    warnedClusterFallback = true
    console.warn('[nuxt-i18n] Set `defaultLocale` to annotate an `x-default` alternate for your domains.')
  }

  // alternate links resolve through the same routing as navigation, shaped for the canonical domain
  const alternateCtx = { ...ctx, afterSwitchLocalePath: ctx.getAlternatePath }

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
    currentLocale: locale,
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
    getLocalizedRoute: (locale, route) => switchLocalePath(alternateCtx, locale, route),
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
  // The route these params belong to, captured where the composable is created —
  // that is, in the owning page's `setup()`. Checked by both the setter and the
  // navigation watcher below, so a page can neither write to a route it no
  // longer occupies nor re-apply its params to whichever route comes next.
  const _i18nParamsRoute = router.currentRoute.value.name
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
      // A page is kept mounted while the next one resolves, so without this
      // check the page being left stamps its params onto the page being entered.
      if (!ownsCurrentRoute()) {
        return
      }
      router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] = _i18nParams.value
      ctx.strictSeo && updateState()
    },
  )

  if (getCurrentScope()) {
    onScopeDispose(unsub)
  }

  function ownsCurrentRoute() {
    return router.currentRoute.value.name === _i18nParamsRoute
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
    // A page whose data resolves only after the user has navigated away must not
    // write its params onto the route they landed on.
    if (!ownsCurrentRoute()) {
      return
    }

    i18nParams.value = { ...params }
    ctx.strictSeo && updateState()
    if (!ctx.strictSeo) {
      const val = _localeHead(createHeadContext(ctx, ctxOptions.value as Required<I18nHeadOptions>))
      patchHead(head, val)
    }
  }
}

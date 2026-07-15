import { useHead, useNuxtApp, useRequestURL, useRouter } from '#imports'
import { createRoutingContext } from './routing/context'

import type { NuxtApp } from '#app'
import type { I18nHeadMetaInfo, I18nHeadOptions } from '#internal-i18n-types'
import type { NuxtI18nContext } from './context'
import type { RoutingContext } from './routing/context'

/**
 * Common options used internally by composable functions, these
 * are initialized on request at the start of i18n:plugin.
 *
 * Extends the platform-neutral {@link RoutingContext} with Nuxt-specific
 * head/SEO state and the client hydration payload.
 *
 * @internal
 */
export type ComposableContext = RoutingContext & {
  strictSeo: boolean
  routingOptions: {
    defaultLocale: string
    /** Use `canonicalQueries` for alternate links */
    strictCanonicals: boolean
    /** Enable/disable hreflangLinks */
    hreflangLinks: boolean
    /** Whether locales are resolved from domains */
    domains: boolean
  }
  head: ReturnType<typeof import('nuxt/app').useHead>
  _head: ReturnType<typeof import('nuxt/app').useHead> | undefined
  metaState: Required<I18nHeadMetaInfo>
  seoSettings: I18nHeadOptions
  localePathPayload: Record<string, Record<string, string> | false>
}

export function useComposableContext(nuxtApp: NuxtApp): ComposableContext {
  const context = nuxtApp?._nuxtI18n?.composableCtx
  if (!context) {
    throw new Error(
      'i18n context is not initialized. Ensure the i18n plugin is installed and the composable is used within a Vue component or setup function.',
    )
  }
  return context
}

export function createComposableContext(ctx: NuxtI18nContext, nuxtApp: NuxtApp = useNuxtApp()): ComposableContext {
  const localePathPayload = getLocalePathPayload(nuxtApp)
  const routingCtx = createRoutingContext({
    router: useRouter(),
    defaultLocale: ctx.getDefaultLocale(),
    getLocale: ctx.getLocale,
    getLocales: ctx.getLocales,
    getBaseUrl: ctx.getBaseUrl,
    getHost: () => useRequestURL({ xForwardedHost: true }).host,
    getLocalePathPayload: () => __I18N_STRICT_SEO__ && import.meta.client && nuxtApp.isHydrating && localePathPayload,
    strategy: __I18N_STRATEGY__,
    routing: __I18N_ROUTING__,
    differentDomains: __DIFFERENT_DOMAINS__,
    multiDomainLocales: __MULTI_DOMAIN_LOCALES__,
    trailingSlash: __TRAILING_SLASH__,
    strictSeo: __I18N_STRICT_SEO__,
    compactRoutes: __I18N_COMPACT_ROUTES__,
  })

  return {
    ...routingCtx,
    strictSeo: __I18N_STRICT_SEO__,
    _head: undefined,
    get head() {
      this._head ??= useHead({})
      return this._head
    },
    metaState: { htmlAttrs: {}, meta: [], link: [] },
    seoSettings: {
      dir: __I18N_STRICT_SEO__,
      lang: __I18N_STRICT_SEO__,
      // the object form carries `canonicalQueries`, `__I18N_STRICT_SEO__` only compiles its truthiness
      seo: (typeof ctx.config.experimental.strictSeo === 'object' && ctx.config.experimental.strictSeo)
        || __I18N_STRICT_SEO__,
    },
    localePathPayload,
    routingOptions: {
      defaultLocale: ctx.getDefaultLocale(),
      domains: __DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__,
      strictCanonicals: ctx.config.experimental.alternateLinkCanonicalQueries ?? true,
      hreflangLinks: !(!__I18N_ROUTING__ && !__DIFFERENT_DOMAINS__),
    },
  }
}

function getLocalePathPayload(nuxtApp = useNuxtApp()) {
  const payload = import.meta.client && document.querySelector(`[data-nuxt-i18n-slp="${nuxtApp._id}"]`)?.textContent
  return JSON.parse(payload || '{}') as Record<string, Record<string, string> | false>
}

declare global {
  interface Window {
    _i18nSlp: Record<string, Record<string, unknown> | false> | undefined
  }
}

import { isEqual, joinURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { isFunction, isString } from '@intlify/shared'
import { navigateTo, ref, useHead, useNuxtApp, useRouter, type Ref } from '#imports'
import { localeCodes, normalizedLocales, vueI18nConfigs } from '#build/i18n.options.mjs'
import { getComposer } from './compatibility'
import { getHost, getLocaleDomain } from './domain'
import { loadVueI18nOptions } from './shared/messages'
import { createLocaleRouteNameGetter, createLocalizedRouteByPathResolver } from './routing/utils'
import { getRouteBaseName as _getRouteBaseName } from '#i18n-kit/routing'
import {
  localePath,
  switchLocalePath,
  type RouteLike,
  type RouteLikeWithName,
  type RouteLikeWithPath
} from './routing/routing'
import { useNuxtI18nContext } from './context'

import type { Locale, I18nOptions } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { RouteLocationPathRaw, Router, RouteRecordNameGeneric } from 'vue-router'
import type {
  DetectBrowserLanguageOptions,
  I18nHeadMetaInfo,
  I18nHeadOptions,
  I18nPublicRuntimeConfig,
  LocaleObject
} from '#internal-i18n-types'
import type { CompatRoute, I18nRouteMeta, RouteLocationGenericPath } from './types'

/**
 * Common options used internally by composable functions, these
 * are initialized on request at the start of i18n:plugin.
 *
 * @internal
 */
export type ComposableContext = {
  router: Router
  getRoutingOptions: () => {
    defaultLocale: string
    /** Use `canonicalQueries` for alternate links */
    strictCanonicals: boolean
    /** Enable/disable hreflangLinks */
    hreflangLinks: boolean
  }
  getHead: () => ReturnType<typeof useHead>
  getMetaState: () => Ref<Required<I18nHeadMetaInfo>>
  getSeoSettings: () => Ref<I18nHeadOptions>
  getLocale: () => string
  getLocales: () => LocaleObject[]
  getBaseUrl: () => string
  getSLP: () => Record<string, Record<string, string> | false>
  /** Extracts the route base name (without locale suffix) */
  getRouteBaseName: (route: RouteRecordNameGeneric | RouteLocationGenericPath | null) => string | undefined
  /** Modifies the resolved localized path. Middleware for `switchLocalePath` */
  afterSwitchLocalePath: (path: string, locale: string) => string
  /** Provides localized dynamic parameters for the current route */
  getLocalizedDynamicParams: (locale: string) => Record<string, unknown> | false | undefined
  /** Prepares a route object to be resolved as a localized route */
  resolveLocalizedRouteObject: (route: RouteLike, locale: string) => RouteLike
}

// RouteLike object has a path and no name.
export const isRouteLocationPathRaw = (val: RouteLike): val is RouteLocationPathRaw => !!val.path && !val.name

export function useComposableContext(): ComposableContext {
  const context = useNuxtApp()._nuxtI18n
  if (!context) {
    throw new Error(
      'i18n context is not initialized. Ensure the i18n plugin is installed and the composable is used within a Vue component or setup function.'
    )
  }
  return context
}

export function createComposableContext(runtimeI18n: I18nPublicRuntimeConfig): ComposableContext {
  const router = useRouter()
  const ctx = useNuxtI18nContext()
  const nuxtApp = useNuxtApp()
  const defaultLocale = ctx.getDefaultLocale()
  const routeByPathResolver = createLocalizedRouteByPathResolver(router)
  const getLocalizedRouteName = createLocaleRouteNameGetter(defaultLocale)

  function getRouteBaseName(route: RouteRecordNameGeneric | RouteLocationGenericPath | null) {
    return _getRouteBaseName(route, __ROUTE_NAME_SEPARATOR__)
  }

  function resolveLocalizedRouteByName(route: RouteLikeWithName, locale: string) {
    route.name ||= getRouteBaseName(router.currentRoute.value) // fallback to current route name

    // check if localized variant exists
    const localizedName = getLocalizedRouteName(route.name, locale)
    if (router.hasRoute(localizedName)) {
      route.name = localizedName
    }

    return route
  }

  function resolveLocalizedRouteByPath(input: RouteLikeWithPath, locale: string) {
    const route = routeByPathResolver(input, locale) as RouteLike
    const baseName = getRouteBaseName(route)

    if (baseName) {
      route.name = getLocalizedRouteName(baseName, locale)
      return route
    }

    if (!__DIFFERENT_DOMAINS__ && prefixable(locale, defaultLocale)) {
      route.path = '/' + locale + route.path
    }

    route.path = (__TRAILING_SLASH__ ? withTrailingSlash : withoutTrailingSlash)(route.path, true)
    return route
  }

  const head = useHead({})
  const metaState = ref({ htmlAttrs: {}, meta: [], link: [] })
  const seoSettings = ref<I18nHeadOptions>({
    dir: __I18N_STRICT_SEO__,
    lang: __I18N_STRICT_SEO__,
    seo: __I18N_STRICT_SEO__ && runtimeI18n.experimental.strictSeo
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const slp: Record<string, Record<string, string> | false> = import.meta.client
    ? JSON.parse(document.querySelector(`[data-nuxt-i18n-slp="${nuxtApp._id}"]`)?.textContent ?? '{}')
    : {}

  return {
    router,
    getHead: () => head,
    getMetaState: () => metaState,
    getSeoSettings: () => seoSettings,
    getSLP: () => slp,
    getRoutingOptions: () => ({
      defaultLocale: defaultLocale,
      strictCanonicals: runtimeI18n.experimental.alternateLinkCanonicalQueries ?? true,
      hreflangLinks: !(!__I18N_ROUTING__ && !__DIFFERENT_DOMAINS__)
    }),
    getLocale: ctx.getLocale,
    getLocales: ctx.getLocales,
    getBaseUrl: ctx.getBaseUrl,
    getRouteBaseName,
    getLocalizedDynamicParams: locale => {
      if (__I18N_STRICT_SEO__ && import.meta.client && nuxtApp.isHydrating && slp) {
        return slp[locale] || {}
      }
      const params = (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>
      return params[locale]
    },
    afterSwitchLocalePath: (path, locale) => {
      const params = (router.currentRoute.value.meta[__DYNAMIC_PARAMS_KEY__] ?? {}) as Partial<I18nRouteMeta>
      if (__I18N_STRICT_SEO__ && locale && Object.keys(params).length && !params[locale]) {
        return ''
      }
      if (__DIFFERENT_DOMAINS__) {
        return joinURL(ctx.getBaseUrl(locale), path)
      }
      return path
    },
    resolveLocalizedRouteObject: (route, locale) => {
      return isRouteLocationPathRaw(route)
        ? resolveLocalizedRouteByPath(route, locale)
        : resolveLocalizedRouteByName(route, locale)
    }
  }
}

declare global {
  interface Window {
    _i18nSlp: Record<string, Record<string, unknown> | false> | undefined
  }
}

export async function loadAndSetLocale(locale: Locale): Promise<string> {
  const nuxt = useNuxtApp()
  const ctx = useNuxtI18nContext()
  const oldLocale = ctx.getLocale()

  // call `i18n:beforeLocaleSwitch` which may return an override
  // TODO: remove in v11, this is deprecated in favor of `i18n:localeDetected`
  const data = { oldLocale, newLocale: locale, initialSetup: ctx.firstAccess, nuxt }
  // @ts-expect-error context is not typed
  let override = (await nuxt.callHook('i18n:beforeLocaleSwitch', data)) as string | undefined
  if (override != null && import.meta.dev) {
    console.warn('[nuxt-i18n] Do not return in `i18n:beforeLocaleSwitch`, mutate `data.newLocale` instead.')
  }
  override ??= data.newLocale

  if (override && localeCodes.includes(override)) {
    locale = override
  }

  // resolved locale is different from the one passed
  const changed = locale && oldLocale !== locale

  // load locale messages required by locale
  await ctx.loadLocaleMessages(locale)

  const runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
  if (!runtimeI18n.skipSettingLocaleOnNavigate) {
    // set locale cookie in case it is unset or not up to date
    ctx.setLocaleCookie(changed ? locale : oldLocale)

    // update locale
    if (changed) {
      ctx.setLocale(locale)
      await nuxt.callHook('i18n:localeSwitched', { newLocale: locale, oldLocale })
    }
  }

  return locale
}

function skipDetect(detect: DetectBrowserLanguageOptions, path: string, pathLocale: string): boolean {
  // no routes - force detection
  if (!__I18N_ROUTING__) {
    return false
  }

  // detection only on root
  if (detect.redirectOn === 'root' && path !== '/') {
    return true
  }

  // detection only on unprefixed route
  if (detect.redirectOn === 'no prefix' && !detect.alwaysRedirect && pathLocale) {
    return true
  }

  return false
}

export function detectLocale(route: string | CompatRoute): string {
  const nuxtApp = useNuxtApp()
  const path = getCompatRoutePath(route)
  const ctx = useNuxtI18nContext(nuxtApp)
  const { detectBrowserLanguage: detectBrowser, defaultLocale } = nuxtApp.$config.public.i18n as I18nPublicRuntimeConfig
  const { fallbackLocale } = detectBrowser || {}

  function* detect() {
    if (ctx.firstAccess && detectBrowser && !skipDetect(detectBrowser, path, ctx.getLocaleFromRoute(path))) {
      // cookie
      yield ctx.getLocaleCookie()

      // navigator or header
      yield ctx.getBrowserLocale()

      // fallback
      yield fallbackLocale
    }

    if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
      // domain
      yield getLocaleDomain(normalizedLocales, path)
    }

    if (__I18N_ROUTING__) {
      // route
      yield ctx.getLocaleFromRoute(route)
    }
  }

  for (const detected of detect()) {
    if (detected) {
      return detected
    }
  }

  // fallback
  return ctx.getLocale() || defaultLocale || ''
}

/**
 * Returns a localized path to redirect to, or an empty string if no redirection should occur
 */
export function detectRedirect(to: CompatRoute, locale: string): string {
  const routeLocale = useNuxtI18nContext().getLocaleFromRoute(to)
  // no locale change detected from routing
  if (routeLocale === locale || !__I18N_ROUTING__) {
    return ''
  }

  const ctx = useComposableContext()
  const redirectPath = switchLocalePath(ctx, locale, to) || localePath(ctx, to.fullPath, locale)

  // skip redirect if resolved route matches current route (#1889, #2226)
  if (isEqual(redirectPath, to.fullPath)) {
    return ''
  }

  return redirectPath
}

const PERMISSIVE_LOCALE_PATH_RE = new RegExp(`^(?:/(${localeCodes.join('|')}))?(/.*|$)`, 'i')
/**
 * Returns the prefix and path of a route.
 * TODO: consider moving to #i18n-kit/routing
 */
function getRoutePrefixAndPath(routePath: string): { prefix?: string; unprefixed: string } {
  const [, prefix, unprefixed = routePath] = PERMISSIVE_LOCALE_PATH_RE.exec(routePath) ?? []
  return { prefix, unprefixed }
}

export async function navigate(redirectPath: string, routePath: string, locale: string, force = false) {
  const nuxt = useNuxtApp()
  const { rootRedirect, skipSettingLocaleOnNavigate } = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
  const ctx = useNuxtI18nContext(nuxt)

  if (routePath === '/' && rootRedirect) {
    let redirectCode = 302
    if (isString(rootRedirect)) {
      redirectPath = '/' + rootRedirect
    } else {
      redirectPath = '/' + rootRedirect.path
      redirectCode = rootRedirect.statusCode
    }

    return navigateTo(nuxt.$localePath(redirectPath, locale), { redirectCode })
  }

  if (import.meta.client && skipSettingLocaleOnNavigate) {
    const vueI18n = ctx.getVueI18n()
    vueI18n.__pendingLocale = locale
    vueI18n.__pendingLocalePromise = new Promise(resolve => {
      vueI18n.__resolvePendingLocalePromise = resolve
    })
    if (!force) {
      return
    }
  }

  if (__MULTI_DOMAIN_LOCALES__ && __I18N_STRATEGY__ === 'prefix_except_default') {
    const host = getHost()
    const defaultLocale = ctx.getLocales().find(x => x.defaultForDomains?.find(domain => domain === host))?.code
    const { prefix, unprefixed } = getRoutePrefixAndPath(routePath)

    // unprefixed path or default locale
    if (!prefix || defaultLocale === prefix) {
      redirectPath = unprefixed
    } else {
      redirectPath = '/' + locale + unprefixed
    }

    if (!isEqual(routePath, redirectPath)) {
      return navigateTo(redirectPath)
    }

    return
  }

  if (!__DIFFERENT_DOMAINS__ && redirectPath) {
    return navigateTo(redirectPath)
  }
}

export function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    __I18N_ROUTING__ &&
    // only prefix default locale with strategy prefix
    (currentLocale !== defaultLocale || __I18N_STRATEGY__ === 'prefix')
  )
}

/**
 * Returns a getter function which returns the baseUrl
 */
export function createBaseUrlGetter(
  nuxt: NuxtApp,
  getDomainFromLocale: (locale: string) => string | undefined
): () => string {
  const { baseUrl, defaultLocale } = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

  if (isFunction(baseUrl)) {
    return (): string => baseUrl(nuxt)
  }

  const locale = isFunction(defaultLocale) ? /*#__PURE__*/ (defaultLocale as unknown as () => string)() : defaultLocale
  return (): string => {
    if (__DIFFERENT_DOMAINS__ && locale) {
      return (getDomainFromLocale(locale) || baseUrl) ?? ''
    }

    return baseUrl ?? ''
  }
}

// collect unique keys of passed objects
function uniqueKeys(...objects: Array<Record<string, unknown>>): string[] {
  const keySet = new Set<string>()

  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      keySet.add(key)
    }
  }

  return Array.from(keySet)
}

// HMR helper functionality
export function createNuxtI18nDev() {
  const ctx = useNuxtI18nContext()
  const composer = getComposer(ctx.getVueI18n())

  /**
   * Triggers a reload of vue-i18n configs (if needed) and locale message files in the correct order
   *
   * @param locale only passed when a locale file has been changed, if `undefined` indicates a vue-i18n config change
   */
  async function resetI18nProperties(locale?: string) {
    const opts: I18nOptions = await loadVueI18nOptions(vueI18nConfigs)

    const messageLocales = uniqueKeys(opts.messages!, composer.messages.value)
    for (const k of messageLocales) {
      if (locale && k !== locale) continue

      if (opts?.messages && k in opts.messages) {
        composer.setLocaleMessage(k, opts?.messages[k] ?? {})
      }

      await ctx.loadLocaleMessages(k)
    }

    // skip vue-i18n config properties if locale is passed (locale file HMR)
    if (locale != null) return

    const numberFormatLocales = uniqueKeys(opts.numberFormats || {}, composer.numberFormats.value)
    for (const k of numberFormatLocales) {
      composer.setNumberFormat(k, opts.numberFormats?.[k] || {})
    }

    const datetimeFormatsLocales = uniqueKeys(opts.datetimeFormats || {}, composer.datetimeFormats.value)
    for (const k of datetimeFormatsLocales) {
      composer.setDateTimeFormat(k, opts.datetimeFormats?.[k] || {})
    }
  }

  return { resetI18nProperties }
}

function getCompatRoutePath(route: string | CompatRoute) {
  return isString(route) ? route : route.path
}

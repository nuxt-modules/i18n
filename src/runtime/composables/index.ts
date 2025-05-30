import { useNuxtApp, useCookie, useRuntimeConfig, useRequestEvent } from '#imports'
import { ref, watch } from 'vue'
import { _useLocaleHead, _useSetI18nParams } from '../routing/head'
import { useComposableContext } from '../utils'
import { localePath, localeRoute, switchLocalePath } from '../routing/routing'
import type { Ref } from 'vue'
import type { Locale } from 'vue-i18n'
import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#internal-i18n-types'
import type { RouteLocationAsRelativeI18n, RouteLocationResolvedI18n, RouteMap, RouteMapI18n } from 'vue-router'
import type { RouteLocationGenericPath, I18nRouteMeta, CompatRoute } from '../types'

export * from 'vue-i18n'
export * from './shared'

declare module '#app' {
  interface NuxtApp {
    $localePath: LocalePathFunction
    $localeRoute: LocaleRouteFunction
    $routeBaseName: RouteBaseNameFunction
    $switchLocalePath: SwitchLocalePathFunction
    /**
     * @deprecated use {@link useLocaleHead} instead
     */
    $localeHead: LocaleHeadFunction
    /**
     * @deprecated use {@link $routeBaseName} instead
     */
    $getRouteBaseName: RouteBaseNameFunction
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $localePath: LocalePathFunction
    $localeRoute: LocaleRouteFunction
    $routeBaseName: RouteBaseNameFunction
    $switchLocalePath: SwitchLocalePathFunction
    /**
     * @deprecated use {@link useLocaleHead} instead
     */
    $localeHead: LocaleHeadFunction
    /**
     * @deprecated use {@link $routeBaseName} instead
     */
    $getRouteBaseName: RouteBaseNameFunction
  }
}

/**
 * Used to set i18n params for the current route.
 *
 * @params params - an object with {@link Locale} keys with localized parameters
 */
export type SetI18nParamsFunction = (params: I18nRouteMeta) => void

/**
 * Returns a {@link SetI18nParamsFunction} used to set i18n params for the current route.
 *
 * @param options - An {@link SeoAttributesOptions} object.
 */
export function useSetI18nParams(seo?: SeoAttributesOptions): SetI18nParamsFunction {
  const common = useComposableContext()
  return _useSetI18nParams(common, seo)
}

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An {@link I18nHeadOptions} object.
 */
export type LocaleHeadFunction = (options: I18nHeadOptions) => I18nHeadMetaInfo

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An {@link I18nHeadOptions} object
 * @returns A ref with localized {@link I18nHeadMetaInfo | head properties}.
 */
export function useLocaleHead({ dir = true, lang = true, seo = true }: I18nHeadOptions = {}): Ref<I18nHeadMetaInfo> {
  if (__I18N_STRICT_SEO__) {
    throw new Error(
      'Strict SEO mode is enabled, `useLocaleHead` should not be used as localized head tags are handled internally by `@nuxtjs/i18n`'
    )
  }
  const common = useComposableContext()
  common.seoSettings = { dir, lang, seo }
  const head = _useLocaleHead(common, common.seoSettings as Required<I18nHeadOptions>)

  if (import.meta.client) {
    watch(head, () => (common.metaState = head.value))
  }
  common.metaState = head.value

  return head
}

/**
 * NOTE: regarding composables accepting narrowed route arguments
 * route path string autocompletion is disabled as this can break depending on `strategy`
 * if route resolve is improved to work regardless of strategy this can be enabled again
 *
 * the following would be the complete narrowed type
 * route: Name | RouteLocationAsRelativeI18n | RouteLocationAsStringI18n | RouteLocationAsPathI18n
 */
type RouteLocationI18nGenericPath = Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }

/**
 * Resolves the route base name for the given route.
 *
 * @param route - a route name or route object.
 *
 * @returns Route base name without localization suffix or `undefined` if no name was found.
 */
export type RouteBaseNameFunction = <Name extends keyof RouteMap = keyof RouteMap>(
  route: Name | RouteLocationGenericPath
) => keyof RouteMapI18n | undefined

/**
 * Returns a {@link RouteBaseNameFunction} used get the base name of a route.
 * @example
 * ```ts
 * const routeBaseName = useRouteBaseName()
 * routeBaseName(route.value) // about-us
 * routeBaseName('about-us__nl') // about-us
 * ```
 */
export function useRouteBaseName(): RouteBaseNameFunction {
  const common = useComposableContext()
  return route => {
    if (route == null) return
    return common.getRouteBaseName(route) || undefined
  }
}

/**
 * Resolves a localized path for the given route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns Returns the localized path for the given route.
 */
export type LocalePathFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => string

/**
 * Returns a {@link LocalePathFunction} used to resolve a localized path.
 * @example
 * ```ts
 * const localePath = useLocalePath()
 * localePath('about-us', 'nl') // /nl/over-ons
 * localePath({ name: 'about-us' }, 'nl') // /nl/over-ons
 * ```
 */
export function useLocalePath(): LocalePathFunction {
  const common = useComposableContext()
  return (route, locale) => localePath(common, route as CompatRoute, locale)
}

/**
 * Resolves a localized route object for the given route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns A route or `undefined` if no route was resolved.
 */
export type LocaleRouteFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => RouteLocationResolvedI18n<Name> | undefined

/**
 * Returns a {@link LocaleRouteFunction} used to resolve localized route objects.
 */
export function useLocaleRoute(): LocaleRouteFunction {
  const common = useComposableContext()
  return (route, locale) => localeRoute(common, route as CompatRoute, locale)
}

/**
 * Resolves a localized variant of the current path.
 *
 * @param locale - (default: current locale).
 */
export type SwitchLocalePathFunction = (locale: Locale) => string

/**
 * Returns a {@link SwitchLocalePathFunction} used to resolve a localized variant of the current path.
 * @example
 * ```ts
 * const switchLocalePath = useSwitchLocalePath()
 * switchLocalePath('en') // /about
 * switchLocalePath('nl') // /nl/over-ons
 * ```
 */
export function useSwitchLocalePath(): SwitchLocalePathFunction {
  const common = useComposableContext()
  return locale => switchLocalePath(common, locale)
}

/**
 * Return the browser locale based on `navigator.languages` (client-side) or `accept-language` header (server-side).
 *
 * @returns the browser locale or `null` if none detected.
 */
export function useBrowserLocale(): string | null {
  return useNuxtApp().$i18n.getBrowserLocale() || null
}

/**
 * Returns the locale cookie based on `document.cookie` (client-side) or `cookie` header (server-side).
 *
 * @returns a ref with the detected cookie or an empty string if none is detected or if `detectBrowserLanguage.useCookie` is disabled.
 */
export function useCookieLocale(): Ref<string> {
  const locale: Ref<string> = ref('')
  const detect = useRuntimeConfig().public.i18n.detectBrowserLanguage

  if (!detect || !detect.useCookie) {
    return locale
  }
  const locales = useComposableContext().getLocales()
  const code = useCookie(detect.cookieKey).value
  if (code && locales.some(x => x.code === code)) {
    locale.value = code
  }

  return locale
}

const warnRuntimeUsage = (method: string) =>
  console.warn(
    method +
      '() is a compiler-hint helper that is only usable inside ' +
      'the script block of a single file component. Its arguments should be ' +
      'compiled away and passing it at runtime has no effect.'
  )

/**
 * The i18n custom route for page components
 */
export interface I18nRoute {
  /**
   * Customize page component routes per locale, you can specify static and dynamic paths.
   */
  paths?: Partial<Record<Locale, `/${string}`>>
  /**
   * Locales in which the page component should be localized.
   */
  locales?: Locale[]
}

/**
 * Define custom route for page component
 *
 * @param route - The custom route
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defineI18nRoute(route: I18nRoute | false): void {
  if (import.meta.dev) {
    warnRuntimeUsage('defineI18nRoute')
  }
}

/**
 * Register translation keys for preloading
 *
 * This is used to track keys to include in the preloaded messages which
 * otherwise would not be included during SSR.
 *
 * Examples of keys to register are dynamically or conditionally rendered translations (e.g. inside `v-if` or using computed keys).
 *
 * @param keys - The translation keys to preload
 *
 * @example
 * ```ts
 * useI18nPreloadKeys(['my-dynamic-key', 'nested.dynamic.key'])
 * ```
 */
export function useI18nPreloadKeys(keys: string[]): void {
  if (import.meta.server) {
    const ctx = useRequestEvent()?.context?.nuxtI18n
    if (ctx == null) {
      console.warn('useI18nPreloadKeys(): `nuxtI18n` server context is accessible.')
      return
    }

    const locale = useComposableContext().getLocale()
    if (!locale) {
      console.warn('useI18nPreloadKeys(): Could not resolve locale during server-side render.')
      return
    }

    for (const k of keys) {
      ctx?.trackKey(k, locale)
    }
  }
}

import { useNuxtApp, useCookie } from '#imports'
import { ref } from 'vue'
import { runtimeDetectBrowserLanguage, wrapComposable } from '../internal'
import { localeCodes } from '#build/i18n.options.mjs'
import { _useLocaleHead, _useSetI18nParams } from '../routing/head'
import { getRouteBaseName, localePath, localeRoute, switchLocalePath } from '../routing/routing'
import type { Ref } from 'vue'
import type { Locale } from 'vue-i18n'
import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#internal-i18n-types'
import type { RouteLocationAsRelativeI18n, RouteLocationResolvedI18n, RouteMap, RouteMapI18n } from 'vue-router'
import type { RouteLocationGenericPath, I18nRouteMeta } from '../types'

export * from 'vue-i18n'
export * from './shared'

/**
 * Used to set i18n params for the current route.
 *
 * @params params - an object with {@link Locale} keys with localized parameters
 */
export type SetI18nParamsFunction = (params: I18nRouteMeta) => void

/**
 * Returns a {@link SetI18nParamsFunction} used to set i18n params for the current route.
 *
 * @param options - An options object, see {@link SeoAttributesOptions}.
 *
 * @returns a {@link SetI18nParamsFunction}.
 */
export function useSetI18nParams(seo?: SeoAttributesOptions): SetI18nParamsFunction {
  return wrapComposable(_useSetI18nParams)(seo)
}

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An options object, see {@link I18nHeadOptions}.
 *
 * @returns The localized head properties.
 */
export type LocaleHeadFunction = (options: I18nHeadOptions) => I18nHeadMetaInfo

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An options object, see {@link I18nHeadOptions}
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties} with Vue `ref`.
 */
export function useLocaleHead({
  dir = true,
  lang = true,
  seo = true,
  key = 'hid'
}: I18nHeadOptions = {}): Ref<I18nHeadMetaInfo> {
  return wrapComposable(_useLocaleHead)({ dir, lang, seo, key })
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
 * @returns Route base name (without localization suffix) or `undefined` if no name was found.
 */
export type RouteBaseNameFunction = <Name extends keyof RouteMap = keyof RouteMap>(
  route: Name | RouteLocationGenericPath
) => string | undefined

/**
 * Returns a {@link RouteBaseNameFunction} used get the base name of a route.
 */
export function useRouteBaseName(): RouteBaseNameFunction {
  return wrapComposable(getRouteBaseName)
}

/**
 * Resolves a localized path for the given route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns Returns the localized URL for a given route.
 */
export type LocalePathFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => string

/**
 * Returns a {@link LocalePathFunction} used to resolve a localized path.
 */
export function useLocalePath(): LocalePathFunction {
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localePath)
}

/**
 * Resolves a localized route object for the given route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns A route. if cannot resolve, `undefined` is returned.
 */
export type LocaleRouteFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => RouteLocationResolvedI18n<Name> | undefined

/**
 * Returns a {@link LocaleRouteFunction} used to resolve localized route objects.
 */
export function useLocaleRoute(): LocaleRouteFunction {
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localeRoute)
}

/**
 * Resolves a localized variant of the current path.
 *
 * @param locale - (default: current locale).
 */
export type SwitchLocalePathFunction = (locale: Locale) => string

/**
 * Returns a {@link SwitchLocalePathFunction} used to resolve a localized variant of the current path.
 */
export function useSwitchLocalePath(): SwitchLocalePathFunction {
  return wrapComposable(switchLocalePath)
}

/**
 * Return the browser locale based on `navigator.languages` (client-side) or `accept-language` header (server-side).
 *
 * @returns the browser locale, if not detected, return `null`.
 */
export function useBrowserLocale(): string | null {
  return useNuxtApp().$i18n.getBrowserLocale() || null
}

/**
 * Returns the locale cookie based on `document.cookie` (client-side) or `cookie` header (server-side).
 *
 * @returns a `Ref<string>` with the detected cookie or an empty string if none is detected or if `detectBrowserLanguage.useCookie` is disabled.
 */
export function useCookieLocale(): Ref<string> {
  const locale: Ref<string> = ref('')
  const detect = runtimeDetectBrowserLanguage()

  if (!detect || !detect.useCookie) {
    return locale
  }

  const code = useCookie(detect.cookieKey!).value
  if (code && localeCodes.includes(code)) {
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
   * Customize page component routes per locale.
   *
   * @description You can specify static and dynamic paths for vue-router.
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

import type { RouteLocation, RouteLocationNormalizedLoaded, RouteLocationRaw, Router } from 'vue-router'

import { getRouteBaseName, localePath, localeRoute, localeLocation, switchLocalePath } from '../compatibles'

import type { Locale } from 'vue-i18n'

/**
 * The function that resolves the route base name.
 *
 * @remarks
 * The parameter signatures of this function is the same as {@link getRouteBaseName}.
 *
 * @param givenRoute - A route location. The path or name of the route or an object for more complex routes.
 *
 * @returns The route base name, if route name is not defined, return `null`.
 *
 * @see {@link useRouteBaseName}
 *
 * @public
 */
export type RouteBaseNameFunction = (givenRoute?: RouteLocationNormalizedLoaded) => string | undefined

/**
 * The `useRouteBaseName` composable returns a function which returns the route base name.
 *
 * @remarks
 * The function returned by `useRouteBaseName` is the wrapper function with the same signature as {@link getRouteBaseName}.
 *
 * @param options - An options see about details {@link I18nCommonRoutingOptionsWithComposable}.
 *
 * @returns A {@link RouteBaseNameFunction}.
 *
 * @public
 */
export function useRouteBaseName(): RouteBaseNameFunction {
  return getRouteBaseName
}

/**
 * The function that resolve locale path.
 *
 * @remarks
 * The parameter sygnatures of this function is same as {@link localePath}.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns Returns the localized URL for a given route.
 *
 * @see {@link useLocalePath}
 *
 * @public
 */
export type LocalePathFunction = (route: RouteLocation | RouteLocationRaw, locale?: Locale) => string

/**
 * The `useLocalePath` composable returns function  that resolve the locale path.
 *
 * @remarks
 * The function returned by `useLocalePath` is the wrapper function with the same signature as {@link localePath}.
 *
 * @param options - An options, see about details {@link I18nCommonRoutingOptionsWithComposable}.
 *
 * @returns A {@link LocalePathFunction}.
 *
 * @public
 */
export function useLocalePath(): LocalePathFunction {
  return localePath
}

/**
 * The function that resolve route.
 *
 * @remarks
 * The parameter sygnatures of this function is same as {@link localeRoute}.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optinal, if not specified, uses the current locale.
 *
 * @returns the route object for a given route, the route object is resolved by vue-router rather than just a full route path.
 *
 * @see {@link useLocaleRoute}
 *
 * @public
 */
export type LocaleRouteFunction = (
  route: RouteLocationRaw,
  locale?: Locale
) => ReturnType<Router['resolve']> | undefined

/**
 * The `useLocaleRoute` composable returns function that resolve the locale route.
 *
 * @remarks
 * The function returned by `useLocaleRoute` is the wrapper function with the same signature as {@link localeRoute}.
 *
 * @param options - An options, see about details {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link LocaleRouteFunction}.
 *
 * @public
 */
export function useLocaleRoute(): LocaleRouteFunction {
  return localeRoute
}

/**
 * The function that resolve locale location.
 *
 * @remarks
 * The parameter sygnatures of this function is same as {@link localeLocation}.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns the location object for a given route, the location object is resolved by vue-router rather than just a full route path.
 *
 * @see {@link useLocaleLocation}
 *
 * @public
 */
export type LocaleLocationFunction = (route: RouteLocationRaw, locale?: Locale) => Location | RouteLocation | undefined

/**
 * The `useLocaleLocation` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useLocaleLocation` is the wrapper function with the same signature as {@link localeLocation}.
 *
 * @param options - An options, see about details {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link LocaleLocationFunction}.
 *
 * @public
 */
export function useLocaleLocation(): LocaleLocationFunction {
  return localeLocation
}

/**
 * The functin that swtich locale path.
 *
 * @remarks
 * The parameter sygnatures of this function is same as {@link switchLocalePath}.
 *
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns A link to the current route in another language.
 *
 * @see {@link useSwitchLocalePath}
 *
 * @public
 */
export type SwitchLocalePathFunction = (locale: Locale) => string

/**
 * The `useSwitchLocalePath` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useSwitchLocalePath` is the wrapper function with the same signature as {@link switchLocalePath}.
 *
 * @param options - An options, see about details {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link SwitchLocalePathFunction}.
 *
 * @public
 */
export function useSwitchLocalePath(): SwitchLocalePathFunction {
  return switchLocalePath
}

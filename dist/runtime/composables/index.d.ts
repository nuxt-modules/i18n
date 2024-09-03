import { localeHead } from '../routing/compatibles.js';
import type { Ref } from 'vue';
import type { Locale } from 'vue-i18n';
import type { RouteLocation, RouteLocationNormalizedLoaded, RouteLocationRaw, Router } from 'vue-router';
import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#build/i18n.options.mjs';
export * from 'vue-i18n';
export * from './shared.js';
/**
 * Returns a function to set i18n params.
 *
 * @param options - An options object, see {@link SeoAttributesOptions}.
 *
 * @returns a {@link SetI18nParamsFunction}.
 *
 * @public
 */
export type SetI18nParamsFunction = (params: Partial<Record<Locale, unknown>>) => void;
export declare function useSetI18nParams(seoAttributes?: SeoAttributesOptions): SetI18nParamsFunction;
/**
 * The `localeHead` function returns localized head properties for locale-related aspects.
 *
 * @remarks
 * The parameter signature of this function is the same as {@link localeHead}.
 *
 * @param options - An options object, see {@link I18nHeadOptions}
 *
 * @returns the route object for a given route, the route object is resolved by vue-router rather than just a full route path.
 *
 * @see {@link localeHead}
 *
 * @public
 */
export type LocaleHeadFunction = (options: I18nHeadOptions) => ReturnType<typeof localeHead>;
/**
 * The `useLocaleHead` composable returns localized head properties for locale-related aspects.
 *
 * @param options - An options object, see {@link I18nHeadOptions}
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties} with Vue `ref`.
 *
 * @public
 */
export declare function useLocaleHead({ addDirAttribute, addSeoAttributes, identifierAttribute }?: I18nHeadOptions): Ref<I18nHeadMetaInfo>;
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
export type RouteBaseNameFunction = (givenRoute?: RouteLocationNormalizedLoaded) => string | undefined;
/**
 * The `useRouteBaseName` composable returns a function which returns the route base name.
 *
 * @remarks
 * The function returned by `useRouteBaseName` is the wrapper function with the same signature as {@link getRouteBaseName}.
 *
 * @returns A {@link RouteBaseNameFunction}.
 *
 * @public
 */
export declare function useRouteBaseName(): RouteBaseNameFunction;
/**
 * The function that resolve locale path.
 *
 * @remarks
 * The parameter signature of this function is same as {@link localePath}.
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
export type LocalePathFunction = (route: RouteLocation | RouteLocationRaw, locale?: Locale) => string;
/**
 * The `useLocalePath` composable returns function  that resolve the locale path.
 *
 * @remarks
 * The function returned by `useLocalePath` is the wrapper function with the same signature as {@link localePath}.
 *
 * @returns A {@link LocalePathFunction}.
 *
 * @public
 */
export declare function useLocalePath(): LocalePathFunction;
/**
 * The function that resolve route.
 *
 * @remarks
 * The parameter signature of this function is same as {@link localeRoute}.
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
export type LocaleRouteFunction = (route: RouteLocationRaw, locale?: Locale) => ReturnType<Router['resolve']> | undefined;
/**
 * The `useLocaleRoute` composable returns function that resolve the locale route.
 *
 * @remarks
 * The function returned by `useLocaleRoute` is the wrapper function with the same signature as {@link localeRoute}.
 *
 * @returns A {@link LocaleRouteFunction}.
 *
 * @public
 */
export declare function useLocaleRoute(): LocaleRouteFunction;
/**
 * The function that resolve locale location.
 *
 * @remarks
 * The parameter signature of this function is same as {@link localeLocation}.
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
export type LocaleLocationFunction = (route: RouteLocationRaw, locale?: Locale) => Location | RouteLocation | undefined;
/**
 * The `useLocaleLocation` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useLocaleLocation` is the wrapper function with the same signature as {@link localeLocation}.
 *
 * @returns A {@link LocaleLocationFunction}.
 *
 * @public
 */
export declare function useLocaleLocation(): LocaleLocationFunction;
/**
 * The functin that swtich locale path.
 *
 * @remarks
 * The parameter signature of this function is same as {@link switchLocalePath}.
 *
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns A link to the current route in another language.
 *
 * @see {@link useSwitchLocalePath}
 *
 * @public
 */
export type SwitchLocalePathFunction = (locale: Locale) => string;
/**
 * The `useSwitchLocalePath` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useSwitchLocalePath` is the wrapper function with the same signature as {@link switchLocalePath}.
 *
 * @returns A {@link SwitchLocalePathFunction}.
 *
 * @public
 */
export declare function useSwitchLocalePath(): SwitchLocalePathFunction;
/**
 * The `useBrowserLocale` composable returns the browser locale.
 *
 * @remarks
 * if this composable function is called on client-side, it detects the locale from the value of `navigator.languages`. Else on the server side, the locale is detected from the value of `accept-language` header.
 *
 * @returns the browser locale, if not detected, return `null`.
 *
 * @public
 */
export declare function useBrowserLocale(): string | null;
/**
 * The `useCookieLocale` composable returns the cookie locale.
 *
 * @remarks
 * If this composable function is called client-side, it detects the locale from the value of `document.cookie` via `useCookie`. Otherwise when used server-side, it detects the locale from the value of the `cookie` header.
 *
 * Note that if the value of `detectBrowserLanguage.useCookie` is `false`, an empty string is always returned.
 *
 * @returns the cookie locale with Vue `ref`. if not detected, return **empty string** with `ref`.
 *
 * @public
 */
export declare function useCookieLocale(): Ref<string>;
/**
 * TODO:
 *  `paths`, `locales` completions like `unplugin-vue-router`
 *  ref: https://github.com/posva/unplugin-vue-router
 */
/**
 * The i18n custom route for page components
 */
export interface I18nRoute {
    /**
     * Customize page component routes per locale.
     *
     * @description You can specify static and dynamic paths for vue-router.
     */
    paths?: Partial<Record<Locale, string>>;
    /**
     * Some locales to which the page component should be localized.
     */
    locales?: Locale[];
}
/**
 * Define custom route for page component
 *
 * @param route - The custom route
 */
export declare function defineI18nRoute(route: I18nRoute | false): void;

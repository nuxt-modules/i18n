import { type CommonComposableOptions } from '../../utils.js';
import type { PrefixableOptions, SwitchLocalePathIntercepter } from '#build/i18n.options.mjs';
import type { Locale } from 'vue-i18n';
import type { RouteLocation, RouteLocationRaw, Router, RouteLocationNormalizedLoaded, RouteLocationNormalized } from 'vue-router';
declare function prefixable(options: PrefixableOptions): boolean;
export declare const DefaultPrefixable: typeof prefixable;
/**
 * Returns base name of current (if argument not provided) or passed in route.
 *
 * @remarks
 * Base name is name of the route without locale suffix and other metadata added by nuxt i18n module

 * @param givenRoute - A route.
 *
 * @returns The route base name. if cannot get, `undefined` is returned.
 *
 * @public
 */
export declare function getRouteBaseName(common: CommonComposableOptions, givenRoute?: RouteLocation): string | undefined;
/**
 * Returns localized path for passed in route.
 *
 * @remarks
 * If locale is not specified, uses current locale.
 *
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A path of the current route.
 *
 * @public
 */
export declare function localePath(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale): string;
/**
 * Returns localized route for passed in `route` parameters.
 *
 * @remarks
 * If `locale` is not specified, uses current locale.
 *
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A route. if cannot resolve, `undefined` is returned.
 *
 * @public
 */
export declare function localeRoute(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale): ReturnType<Router['resolve']> | undefined;
/**
 * Returns localized location for passed in route parameters.
 *
 * @remarks
 * If `locale` is not specified, uses current locale.
 *
 * @param route - A route.
 * @param locale - A locale, optional.
 *
 * @returns A route location. if cannot resolve, `undefined` is returned.
 *
 * @public
 */
export declare function localeLocation(common: CommonComposableOptions, route: RouteLocationRaw, locale?: Locale): Location | (RouteLocation & {
    href: string;
}) | undefined;
export declare function resolveRoute(common: CommonComposableOptions, route: RouteLocationRaw, locale: Locale | undefined): import("vue-router").RouteLocationResolvedGeneric | null | undefined;
export declare const DefaultSwitchLocalePathIntercepter: SwitchLocalePathIntercepter;
/**
 * Returns path of the current route for specified locale.
 *
 * @param locale - A locale
 *
 * @returns A path of the current route.
 *
 * @public
 */
export declare function switchLocalePath(common: CommonComposableOptions, locale: Locale, _route?: RouteLocationNormalized | RouteLocationNormalizedLoaded): string;
export {};

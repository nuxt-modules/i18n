import type { I18n, Locale } from 'vue-i18n';
import type { NuxtApp } from '#app';
import type { Ref } from '#imports';
import type { Router } from '#vue-router';
import type { DetectLocaleContext } from './internal.js';
import type { HeadSafe } from '@unhead/vue';
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router';
import type { RuntimeConfig } from '@nuxt/schema';
import type { ModulePublicRuntimeConfig } from '../module.js';
import type { PrefixableOptions, SwitchLocalePathIntercepter, BaseUrlResolveHandler, LocaleObject, Strategies } from '#build/i18n.options.mjs';
/**
 * Common options used internally by composable functions, these
 * are initialized when calling a wrapped composable function.
 *
 * @internal
 */
export type CommonComposableOptions = {
    router: Router;
    i18n: I18n;
    runtimeConfig: RuntimeConfig;
    metaState: Ref<Record<Locale, any>>;
};
export declare function initCommonComposableOptions(i18n?: I18n): CommonComposableOptions;
export declare function loadAndSetLocale(newLocale: Locale, i18n: I18n, runtimeI18n: ModulePublicRuntimeConfig['i18n'], initial?: boolean): Promise<boolean>;
type LocaleLoader = () => Locale;
export declare function detectLocale(route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded, routeLocale: string, initialLocaleLoader: Locale | LocaleLoader, detectLocaleContext: DetectLocaleContext, runtimeI18n: ModulePublicRuntimeConfig['i18n']): string;
type DetectRedirectOptions = {
    route: {
        to: RouteLocationNormalized | RouteLocationNormalizedLoaded;
        from?: RouteLocationNormalized | RouteLocationNormalizedLoaded;
    };
    /**
     * The locale we want to navigate to
     */
    locale: Locale;
    /**
     * Locale detected from route
     */
    routeLocale: string;
    strategy: Strategies;
};
/**
 * Returns a localized path to redirect to, or an empty string if no redirection should occur
 *
 * @param inMiddleware - whether this is called during navigation middleware
 */
export declare function detectRedirect({ route, locale, routeLocale, strategy }: DetectRedirectOptions, inMiddleware?: boolean): string;
type NavigateArgs = {
    nuxtApp: NuxtApp;
    i18n: I18n;
    redirectPath: string;
    locale: string;
    route: RouteLocationNormalized | RouteLocationNormalizedLoaded;
};
export declare function navigate(args: NavigateArgs, { status, enableNavigate }?: {
    status?: number;
    enableNavigate?: boolean;
}): Promise<any>;
export declare function injectNuxtHelpers(nuxt: NuxtApp, i18n: I18n): void;
export declare function extendPrefixable(runtimeConfig?: any): (opts: PrefixableOptions) => boolean;
export declare function extendSwitchLocalePathIntercepter(runtimeConfig?: any): SwitchLocalePathIntercepter;
export declare function extendBaseUrl(): BaseUrlResolveHandler<NuxtApp>;
export type HeadParam = Required<Pick<HeadSafe, 'meta' | 'link'>>;
export declare function getNormalizedLocales(locales: string[] | LocaleObject[]): LocaleObject[];
export {};

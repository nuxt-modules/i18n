import { type CommonComposableOptions } from './utils.js';
import type { Locale } from 'vue-i18n';
import type { DetectBrowserLanguageOptions, LocaleObject } from '#build/i18n.options.mjs';
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router';
import type { CookieRef } from 'nuxt/app';
import type { ModulePublicRuntimeConfig } from '../module.js';
export declare function formatMessage(message: string): string;
export declare function defineGetter<K extends string | number | symbol, V>(obj: Record<K, V>, key: K, val: V): void;
type TailParameters<T> = T extends (first: CommonComposableOptions, ...rest: infer R) => unknown ? R : never;
export declare function wrapComposable<F extends (common: CommonComposableOptions, ...args: any[]) => any>(fn: F, common?: CommonComposableOptions): (...args: TailParameters<F>) => any;
/**
 * Parses locales provided from browser through `accept-language` header.
 *
 * @param input - Accept-Language header value.
 * @return An array of locale codes. Priority determined by order in array.
 */
export declare function parseAcceptLanguage(input: string): string[];
export declare function getBrowserLocale(): string | undefined;
export declare function getI18nCookie(): any;
export declare function getLocaleCookie(cookieRef: CookieRef<string | undefined>, detect: false | DetectBrowserLanguageOptions, defaultLocale: string): string | undefined;
export declare function setLocaleCookie(cookieRef: CookieRef<string | undefined>, locale: string, detect: false | DetectBrowserLanguageOptions): void;
export declare const enum DetectFailure {
    NOT_FOUND = "not_found_match",
    FIRST_ACCESS = "first_access_only",
    NO_REDIRECT_ROOT = "not_redirect_on_root",
    NO_REDIRECT_NO_PREFIX = "not_redirect_on_no_prefix",
    SSG_IGNORE = "detect_ignore_on_ssg"
}
declare const enum DetectFrom {
    COOKIE = "cookie",
    NAVIGATOR_HEADER = "navigator_or_header",
    FALLBACK = "fallback"
}
type DetectBrowserLanguageFromResult = {
    locale: string;
    from?: DetectFrom;
    reason?: DetectFailure;
};
export type DetectLocaleForSSGStatus = 'ssg_ignore' | 'ssg_setup' | 'normal';
export type DetectLocaleCallType = 'setup' | 'routing';
export type DetectLocaleContext = {
    ssg: DetectLocaleForSSGStatus;
    callType: DetectLocaleCallType;
    firstAccess: boolean;
    localeCookie: string | undefined;
};
export declare const DefaultDetectBrowserLanguageFromResult: DetectBrowserLanguageFromResult;
export declare function detectBrowserLanguage(route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded, detectLocaleContext: DetectLocaleContext, locale?: Locale): DetectBrowserLanguageFromResult;
export declare function getHost(): string | undefined;
export declare function getLocaleDomain(locales: LocaleObject[], strategy: string, route: string | RouteLocationNormalized | RouteLocationNormalizedLoaded): string;
export declare function getDomainFromLocale(localeCode: Locale): string | undefined;
export declare const runtimeDetectBrowserLanguage: (opts?: ModulePublicRuntimeConfig["i18n"]) => false | DetectBrowserLanguageOptions;
export {};

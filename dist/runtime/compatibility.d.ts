/**
 * Utility functions to support both VueI18n and Composer instances
 */
import type { NuxtApp } from '#app';
import type { LocaleObject } from '#build/i18n.options.mjs';
import type { Composer, I18n, Locale, VueI18n } from 'vue-i18n';
import type { UnwrapRef } from 'vue';
export declare function isVueI18n(target: I18n | VueI18n | Composer): target is VueI18n;
export declare function getI18nTarget(i18n: I18n | VueI18n | Composer): Composer<{}, {}, {}, string, never, string> | VueI18n<{}, {}, {}, string, never, string, Composer<{}, {}, {}, string, never, string>>;
export declare function getComposer(i18n: I18n | VueI18n | Composer): Composer;
/**
 * Typesafe access to property of a VueI18n or Composer instance
 */
export declare function getI18nProperty<K extends keyof ReturnType<typeof getI18nTarget>>(i18n: I18n, property: K): UnwrapRef<(Composer<{}, {}, {}, string, never, string> | VueI18n<{}, {}, {}, string, never, string, Composer<{}, {}, {}, string, never, string>>)[K]>;
/**
 * Sets the value of the locale property on VueI18n or Composer instance
 *
 * This differs from the instance `setLocale` method in that it sets the
 * locale property directly without triggering other side effects
 */
export declare function setLocaleProperty(i18n: I18n, locale: Locale): void;
export declare function getLocale(i18n: I18n): Locale;
export declare function getLocales(i18n: I18n): Locale[] | LocaleObject[];
export declare function getLocaleCodes(i18n: I18n): Locale[];
export declare function setLocale(i18n: I18n, locale: Locale): any;
export declare function setLocaleCookie(i18n: I18n, locale: Locale): any;
export declare function mergeLocaleMessage(i18n: I18n, locale: Locale, messages: Record<string, any>): void;
export declare function onBeforeLanguageSwitch(i18n: I18n, oldLocale: Locale, newLocale: Locale, initial: boolean, context: NuxtApp): Promise<any>;
export declare function onLanguageSwitched(i18n: I18n, oldLocale: Locale, newLocale: Locale): any;
declare module 'vue-i18n' {
    interface VueI18n {
        /**
         * This is not exposed in VueI18n's types, but it's used internally
         * @internal
         */
        __composer: Composer;
    }
}

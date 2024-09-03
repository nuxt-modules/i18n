import type { Locale, LocaleMessages, DefineLocaleMessage, I18nOptions } from 'vue-i18n';
type MaybePromise<T> = T | Promise<T>;
/**
 * The `defineI18nLocale` defines a composable function to dynamically load locale messages.
 *
 * @remarks
 * This function is used to dynamically load a locale with lazy-load translations.
 *
 * You can use at JavaScript and TypeScript extension formats.
 *
 * @param locale - A target locale that is passed from nuxt i18n module.
 *
 * @returns Returns the locale messages object that will be resolved with Promise.
 */
export type LocaleLoader<Messages = LocaleMessages<DefineLocaleMessage>, Locales = Locale> = (locale: Locales) => MaybePromise<Messages>;
/**
 * Define locale loader for dynamic locale messages loading
 *
 * @param locale - The target locale
 *
 * @returns The defined locale
 */
export declare function defineI18nLocale<Messages = LocaleMessages<DefineLocaleMessage>, Locales = Locale>(locale: LocaleLoader<Messages, Locales>): LocaleLoader<Messages, Locales>;
/**
 * The `defineI18nConfig` defines a composable function to vue-i18n configuration.
 *
 * @remarks
 * This function is used to pass the `createI18n` options on nuxt i18n module.
 *
 * For more details about configuration, see the [Vue I18n documentation](https://vue-i18n.intlify.dev/api/general.html#createi18n).
 *
 * @returns Return vue-i18n options object that will be resolved by Promise.
 */
export type ConfigLoader<Config extends I18nOptions> = () => MaybePromise<Config>;
/**
 * Define configuration for vue-i18n runtime plugin
 *
 * @param config - The target configuration for vue-i18n
 *
 * @returns The defined configuration
 */
export declare function defineI18nConfig<Config extends I18nOptions>(config: ConfigLoader<Config>): ConfigLoader<Config>;
export {};

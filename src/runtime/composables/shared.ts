import type { Locale, LocaleMessages, DefineLocaleMessage, I18nOptions } from 'vue-i18n'

/**
 * The `defineI18nLocale` defines a composable function to dynamically load locale messages.
 *
 * @param locale - A target locale that is passed from nuxt i18n module.
 *
 * @returns Returns the locale messages object that will be resolved with Promise.
 */
export type LocaleLoader<Messages = LocaleMessages<DefineLocaleMessage>, Locales = Locale> = (
  locale: Locales
) => Messages | Promise<Messages>

/**
 * Define locale loader for dynamic locale messages loading
 *
 * @param locale - The target locale
 *
 * @returns The defined locale
 */
export function defineI18nLocale<Messages = LocaleMessages<DefineLocaleMessage>, Locales = Locale>(
  locale: LocaleLoader<Messages, Locales>
): LocaleLoader<Messages, Locales> {
  return locale
}

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
export type ConfigLoader<Config extends I18nOptions> = () => Config | Promise<Config>

/**
 * Define configuration for vue-i18n runtime plugin
 *
 * @param config - The target configuration for vue-i18n
 *
 * @returns The defined configuration
 */
export function defineI18nConfig<Config extends I18nOptions>(config: ConfigLoader<Config>): ConfigLoader<Config> {
  return config
}

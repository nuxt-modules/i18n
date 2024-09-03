import type { H3Event } from 'h3';
import type { Locale, FallbackLocale } from 'vue-i18n';
/**
 * The locale config for nuxt i18n options
 */
export type LocaleConfig = {
    /**
     * The locale for default
     *
     * @remarks
     * That is set by `defaultLocale` option of nuxt i18n. if it's not set, that is set by `locale` that is loaded with `vueI18n` option (i18n.config). If these do not resolve the locale, use as default `'en-US'`.
     */
    defaultLocale: Locale;
    /**
     * The fallback locale
     *
     * @remarks
     * That is set by `fallbackLocale` option that is loaded with `vueI18n` option (i18n.config). If these do not resolve the fallback locale, use as default `false
     */
    fallbackLocale: FallbackLocale;
};
/**
 * The `defineI18nLocaleDetector` defines a composable function to detect the locale on the server-side
 *
 * @param event - The {@link H3Event | H3} event
 * @param config - The {@link LocaleConfig | locale config}
 *
 * @returns Return locale string
 */
export type LocaleDetector = (event: H3Event, config: LocaleConfig) => string;
/**
 * Define locale detector for server-side locale detection
 *
 * @remarks
 * The locale detector fucntion is used to detect the locale on server-side. It's called per request on the server.
 *
 * @param detector - The {@link LocaleDetector | locale detector}
 *
 * @returns The defined locale detector
 */
export declare function defineI18nLocaleDetector(detector: LocaleDetector): LocaleDetector;

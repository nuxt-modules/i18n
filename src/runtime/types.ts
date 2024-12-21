import type { NuxtApp } from '#app'
import type { ComputedRef } from 'vue'
import type { Directions, LocaleObject, Strategies } from '#internal-i18n-types'
import type { I18n, Locale } from 'vue-i18n'
import type { RouteLocationNormalizedGeneric, RouteRecordNameGeneric } from 'vue-router'

export type CompatRoute = Omit<RouteLocationNormalizedGeneric, 'name'> & {
  name: RouteRecordNameGeneric | null
}

/**
 * Called before the app's locale is switched.
 *
 * @remarks
 * Can be used to override the new locale by returning a new locale code.
 *
 * @param oldLocale - The app's locale before the switch.
 * @param newLocale - The app's locale after the switch.
 * @param initialSetup - Set to `true` if it's the initial locale switch that triggers on app load. It's a special case since the locale is not technically set yet so we're switching from no locale to locale.
 * @param context - the Nuxt app instance.
 *
 * @returns The new locale to switch, or `undefined` to keep the new locale.
 */
type BeforeLanguageSwitchHandler = (
  oldLocale: Locale,
  newLocale: Locale,
  initialSetup: boolean,
  context: NuxtApp
) => Promise<Locale | void>

/**
 * Called after the app's locale is switched.
 *
 * @param oldLocale - The app's locale before the switch
 * @param newLocale - The app's locale after the switch.
 */
type LanguageSwitchedHandler = (oldLocale: Locale, newLocale: Locale) => Promise<void>

interface SharedProperties {
  /**
   * Routing strategy.
   */
  strategy: Strategies
  /**
   * Whether differentDomains option is enabled.
   */
  differentDomains: boolean
  /**
   * Default direction as specified in options.
   */
  defaultDirection: Directions
  /**
   * Default locale as specified in options.
   */
  defaultLocale: Locale
  /**
   * Switches locale of the app to specified locale code.
   *
   * @remarks
   * If `useCookie` option is enabled, locale cookie will be updated with new value.
   *
   * If prefixes are enabled (`strategy` other than `no_prefix`), will navigate to new locale's route.
   *
   * @param locale - A {@link Locale}
   */
  setLocale: (locale: Locale) => Promise<void>
  /**
   * Loads locale messages of the specified locale code.
   *
   * @param locale - A {@link Locale}
   */
  loadLocaleMessages: (locale: Locale) => Promise<void>
  /**
   * Returns browser locale code filtered against the ones defined in options.
   *
   * @returns The browser locale.
   */
  getBrowserLocale: () => string | undefined
  /**
   * Returns locale code from stored locale cookie.
   *
   * @returns The locale cookie
   */
  getLocaleCookie: () => string | undefined
  /**
   * Updates stored locale cookie with specified locale code.
   *
   * @remarks
   * Consider using `setLocale` instead if you want to switch locale.
   *
   * @param locale - A {@link Locale}
   */
  setLocaleCookie: (locale: Locale) => void
  /**
   * Called before the app's locale is switched.
   *
   * @remarks
   * Can be used to override the new locale by returning a new locale code.
   *
   * @param oldLocale - The app's locale before the switch.
   * @param newLocale - The app's locale after the switch.
   * @param initialSetup - Set to `true` if it's the initial locale switch that triggers on app load. It's a special case since the locale is not technically set yet so we're switching from no locale to locale.
   * @param context - the Nuxt app instance.
   *
   * @returns The new locale to switch, or `undefined` to keep the new locale.
   */
  onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
  /**
   * Called after the app's locale is switched.
   *
   * @param oldLocale - The app's locale before the switch
   * @param newLocale - The app's locale after the switch.
   */
  onLanguageSwitched: LanguageSwitchedHandler
  /**
   * Switches to the pending locale that would have been set on navigate, but was prevented by the `skipSettingLocaleOnNavigate` option.
   */
  finalizePendingLocaleChange: () => Promise<void>
  /**
   * Returns a promise that will be resolved once the pending locale is set.
   */
  waitForPendingLocaleChange: () => Promise<void>
}

export interface ComposerCustomProperties<
  ConfiguredLocaleType extends Locale[] | LocaleObject[] = Locale[] | LocaleObject[]
> extends SharedProperties {
  /**
   * List of locales
   *
   * @remarks
   * Can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
   */
  locales: ComputedRef<ConfiguredLocaleType>
  /**
   * List of locale codes
   */
  localeCodes: ComputedRef<Locale[]>
  /**
   * Base URL that is used in generating canonical links
   */
  baseUrl: ComputedRef<string>
  /**
   * Current locale properties.
   */
  localeProperties: ComputedRef<LocaleObject>
}

export interface NuxtI18nRoutingCustomProperties<
  ConfiguredLocaleType extends Locale[] | LocaleObject[] = Locale[] | LocaleObject[]
> extends SharedProperties {
  /**
   * List of locales
   *
   * @remarks
   * Can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
   */
  readonly locales: ConfiguredLocaleType
  /**
   * List of locale codes
   */
  readonly localeCodes: Locale[]
  /**
   * Base URL that is used in generating canonical links
   */
  baseUrl: string
  /**
   * Current locale properties.
   */
  localeProperties: LocaleObject
}

declare module '#app' {
  interface NuxtApp {
    /** @internal */
    _vueI18n: I18n
  }
}

declare module 'vue-i18n' {
  interface I18n {
    __pendingLocale?: string
    __pendingLocalePromise?: Promise<void>
    __firstAccess: boolean
    /**
     * Sets the value of the locale property on VueI18n or Composer instance
     *
     * This differs from the instance `setLocale` method in that it sets the
     * locale property directly without triggering other side effects
     * @internal
     */
    __setLocale: (locale: string) => void
    __resolvePendingLocalePromise?: () => void
    loadLocaleMessages: (locale: Locale) => Promise<void>
  }
}

import type { NuxtApp } from '#app'
import type { ComputedRef } from 'vue'
import type {
  LocaleObject,
  Strategies,
  Directions,
  ComposerCustomProperties as _ComposerCustomProperties
} from 'vue-i18n-routing'
import type { I18nRoutingCustomProperties } from 'vue-i18n-routing/dist/vue-i18n'

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
  oldLocale: string,
  newLocale: string,
  initialSetup: boolean,
  context: NuxtApp
) => string | void

/**
 * Called after the app's locale is switched.
 *
 * @param oldLocale - The app's locale before the switch
 * @param newLocale - The app's locale after the switch.
 */
type LanguageSwitchedHandler = (oldLocale: string, newLocale: string) => void

export interface ComposerCustomProperties {
  /**
   * Routing strategy.
   */
  strategy: Strategies
  /**
   * Current locale properties.
   */
  localeProperties: ComputedRef<LocaleObject>
  /**
   * Whether differentDomains option is enabled.
   */
  differentDomains: boolean
  /**
   * Default direction as specified in options.
   */
  defaultDirection: Directions
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
  setLocale: (locale: string) => Promise<void>
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
  setLocaleCookie: (locale: string) => void
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

export interface NuxtI18nRoutingCustomProperties {
  /**
   * Routing strategy.
   */
  readonly strategy: Strategies
  /**
   * Current locale properties.
   */
  localeProperties: LocaleObject
  /**
   * Whether differentDomains option is enabled.
   */
  readonly differentDomains: boolean
  /**
   * Default direction as specified in options.
   */
  readonly defaultDirection: Directions
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
  setLocale: (locale: string) => Promise<void>
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
  setLocaleCookie: (locale: string) => void
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

declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ComposerCustom extends ComposerCustomProperties, _ComposerCustomProperties {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ExportedGlobalComposer extends NuxtI18nRoutingCustomProperties, I18nRoutingCustomProperties {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface VueI18n extends NuxtI18nRoutingCustomProperties, I18nRoutingCustomProperties {}

  interface I18n {
    __pendingLocale?: string
    __pendingLocalePromise?: Promise<void>
    __resolvePendingLocalePromise?: (value: void | PromiseLike<void>) => void
  }
}

export {}

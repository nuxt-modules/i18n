import type { ComputedRef } from 'vue'
import type { Directions, LocaleObject, Strategies } from '#internal-i18n-types'
import type { Locale, Composer, VueI18n, ExportedGlobalComposer } from 'vue-i18n'
import type {
  HistoryState,
  RouteLocationAsRelative,
  RouteLocationNormalizedGeneric,
  RouteRecordNameGeneric
} from 'vue-router'
import type { ComposableContext } from './utils'
import type { NuxtI18nContext } from './context'

export type CompatRoute = Omit<RouteLocationNormalizedGeneric, 'name'> & {
  name: RouteRecordNameGeneric | null
  state?: HistoryState
}

export type RouteLocationGenericPath = Omit<RouteLocationAsRelative, 'path' | 'name'> & {
  path?: string
  name?: RouteLocationAsRelative['name'] | null
}

export type I18nRouteMeta = Partial<Record<Locale, false | Record<string, unknown>>>

/**
 * @template ConfiguredLocaleType - The type of the locales configuration. Can be an array of string codes or an array of {@link LocaleObject}.
 */
export interface ComposerCustomProperties<
  ConfiguredLocaleType extends Locale[] | LocaleObject[] = Locale[] | LocaleObject[]
> {
  /**
   * List of locales - can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
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
   * Switches locale to the pending locale, used when navigation locale switch is prevented by the `skipSettingLocaleOnNavigate` option.
   */
  finalizePendingLocaleChange: () => Promise<void>
  /**
   * Returns a promise that will be resolved once the pending locale is set.
   */
  waitForPendingLocaleChange: () => Promise<void>

  __extendComposer: (instance: Composer | VueI18n | ExportedGlobalComposer) => void
}

declare module '#app' {
  interface NuxtApp {
    /** @internal */
    _nuxtI18nCtx: NuxtI18nContext
    /** @internal */
    _nuxtI18n: ComposableContext
  }
}

declare module 'vue-i18n' {
  interface I18n {
    /** @internal */ __pendingLocale?: string
    /** @internal */ __pendingLocalePromise?: Promise<void>
    /** @internal */ __resolvePendingLocalePromise?: () => Promise<void>
  }
}

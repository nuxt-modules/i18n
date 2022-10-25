import type { NuxtApp } from '#app'
import type { ComputedRef } from 'vue'
import type {
  LocaleObject,
  Strategies,
  Directions,
  ComposerCustomProperties as _ComposerCustomProperties
} from 'vue-i18n-routing'
import type { I18nRoutingCustomProperties } from 'vue-i18n-routing/dist/vue-i18n'

type BeforeLanguageSwitchHandler = (
  oldLocale: string,
  newLocale: string,
  initialSetup: boolean,
  context: NuxtApp
) => string | void

type LanguageSwitchedHandler = (oldLocale: string, newLocale: string) => void

export interface ComposerCustomProperties {
  strategy: Strategies
  localeProperties: ComputedRef<LocaleObject>
  differentDomains: boolean
  defaultDirection: Directions
  setLocale: (locale: string) => Promise<void>
  getBrowserLocale: () => string | undefined
  getLocaleCookie: () => string | undefined
  setLocaleCookie: (locale: string) => void
  onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
  onLanguageSwitched: LanguageSwitchedHandler
  finalizePendingLocaleChange: () => Promise<void>
  waitForPendingLocaleChange: () => Promise<void>
}

export interface NuxtI18nRoutingCustomProperties {
  readonly strategy: Strategies
  localeProperties: LocaleObject
  readonly differentDomains: boolean
  readonly defaultDirection: Directions
  setLocale: (locale: string) => Promise<void>
  getBrowserLocale: () => string | undefined
  getLocaleCookie: () => string | undefined
  setLocaleCookie: (locale: string) => void
  onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
  onLanguageSwitched: LanguageSwitchedHandler
  finalizePendingLocaleChange: () => Promise<void>
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

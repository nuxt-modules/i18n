import type { ComputedRef } from 'vue'
import type { LocaleObject, Strategies, Directions } from 'vue-i18n-routing'
import type { BeforeLanguageSwitchHandler, LanguageSwitchedHandler } from '#build/i18n.options.mjs'

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

declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
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

  export interface I18n {
    __pendingLocale?: string
    __pendingLocalePromise?: Promise
    __resolvePendingLocalePromise?: (value: unknown) => void
  }
}

declare module 'vue-i18n-bridge' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
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

  export interface I18n {
    __pendingLocale?: string
    __pendingLocalePromise?: Promise
    __resolvePendingLocalePromise?: (value: unknown) => void
  }
}
declare module '@intlify/vue-i18n-bridge' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
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
  export interface I18n {
    __pendingLocale?: string
    __pendingLocalePromise?: Promise
    __resolvePendingLocalePromise?: (value: unknown) => void
  }
}

export {}

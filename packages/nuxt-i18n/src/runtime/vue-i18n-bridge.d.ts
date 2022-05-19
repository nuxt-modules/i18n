import type { ComputedRef } from 'vue-demi'
import type { LocaleObject } from 'vue-i18n-routing'
import type { BeforeLanguageSwitchHandler } from '#build/i18n.options.mjs'

export interface ComposerCustomProperties {
  localeProperties: ComputedRef<LocaleObject>
  setLocale: (locale: string) => void
  getBrowserLocale: () => string | undefined
  getLocaleCookie: () => string | undefined
  setLocaleCookie: (locale: string) => void
  onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
}
declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
    localeProperties: LocaleObject
    setLocale: (locale: string) => void
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
    onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
  }
}

declare module 'vue-i18n-bridge' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
    localeProperties: LocaleObject
    setLocale: (locale: string) => void
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
    onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
  }
}
declare module '@intlify/vue-i18n-bridge' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
    localeProperties: LocaleObject
    setLocale: (locale: string) => void
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
    onBeforeLanguageSwitch: BeforeLanguageSwitchHandler
  }
}

export {}

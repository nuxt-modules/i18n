import type { ComputedRef } from 'vue-demi'
import type { LocaleObject } from 'vue-i18n-routing'

/*
declare module 'vue-i18n' {
  export interface ComposerCustom {
    localeProperties: ComputedRef<LocaleObject>
    setLocale: (locale: string) => Promise<void>
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
  }
}
*/

export interface ComposerCustomProperties {
  localeProperties: ComputedRef<LocaleObject>
  setLocale: (locale: string) => Promise<string>
  getBrowserLocale: () => string | undefined
  getLocaleCookie: () => string | undefined
  setLocaleCookie: (locale: string) => void
}
declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
    localeProperties: LocaleObject
    setLocale: (locale: string) => Promise<string>
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
  }
}

declare module 'vue-i18n-bridge' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
    localeProperties: LocaleObject
    setLocale: (locale: string) => Promise<string>
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
  }
}
declare module '@intlify/vue-i18n-bridge' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ComposerCustom extends ComposerCustomProperties {}
  export interface VueI18n {
    localeProperties: LocaleObject
    setLocale: (locale: string) => Promise<string>
    getBrowserLocale: () => string | undefined
    getLocaleCookie: () => string | undefined
    setLocaleCookie: (locale: string) => void
  }
}

export {}

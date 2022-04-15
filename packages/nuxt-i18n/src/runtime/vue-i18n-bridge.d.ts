import type { ComputedRef } from 'vue-demi'
import type { LocaleObject } from 'vue-i18n-routing'

declare module 'vue-i18n' {
  export interface ComposerCustom {
    localeProperties: ComputedRef<LocaleObject>
    setLocale: (locale: string) => Promise<void>
    getBrowserLocale: () => string | undefined
  }
}

export {}

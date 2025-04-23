declare module '#build/i18n.options.mjs' {
  import type { LocaleObject, VueI18nConfig } from '@nuxtjs/i18n'

  export type { LocaleObject }

  type LocaleLoader = { key: string; cache: boolean; load: () => Promise<never> }
  export const localeLoaders: Record<string, LocaleLoader[]>
  export const vueI18nConfigs: VueI18nConfig[]
  export const localeCodes: string[]
  export const normalizedLocales: LocaleObject[]
  export const isSSG: boolean
  export const hasPages: boolean
  export const parallelPlugin: boolean

  export const NUXT_I18N_MODULE_ID: string
  export const DYNAMIC_PARAMS_KEY: string
  export const DEFAULT_COOKIE_KEY: string
  export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER: string
}

declare module '#internal/i18n/options.mjs' {
  import type { LocaleObject, VueI18nConfig } from '@nuxtjs/i18n'

  type LocaleLoader = { key: string; cache: boolean; load: () => Promise<never> }
  export const localeLoaders: Record<string, LocaleLoader[]>
  export const vueI18nConfigs: VueI18nConfig[]
  export const localeCodes: string[]
  export const normalizedLocales: LocaleObject[]
  export const isSSG: boolean
  export const hasPages: boolean
  export const parallelPlugin: boolean

  export const NUXT_I18N_MODULE_ID: string
  export const DYNAMIC_PARAMS_KEY: string
  export const DEFAULT_COOKIE_KEY: string
  export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER: string
}

declare module '#internal/i18n/locale.detector.mjs' {
  import type { LocaleDetector } from '@nuxtjs/i18n/dist/runtime/composables/server'

  export const localeDetector: LocaleDetector
}

declare module '#internal/i18n-type-generation-options' {
  export const dtsFile: string
}

declare module '#nuxt-i18n/logger' {
  import type { ConsolaInstance } from 'consola'

  export function createLogger(label: string): ConsolaInstance
}

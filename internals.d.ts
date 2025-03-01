declare module '#build/i18n.options.mjs' {
  import type { DeepRequired } from 'ts-essentials'
  import type { LocaleObject, NuxtI18nOptions, VueI18nConfig } from '@nuxtjs/i18n'

  export type { LocaleObject }

  type LocaleLoader = {
    key: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load: () => Promise<any>
    cache: boolean
  }

  export const localeLoaders: Record<string, LocaleLoader[]>

  export const vueI18nConfigs: VueI18nConfig[]

  export const localeCodes: string[]
  export const nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>
  export const normalizedLocales: LocaleObject[]
  export const isSSG = false
  export const hasPages: boolean
  export const parallelPlugin: boolean

  export const NUXT_I18N_MODULE_ID = ''
  export const DEFAULT_DYNAMIC_PARAMS_KEY: string
  export const DEFAULT_COOKIE_KEY: string
  export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER: string
}

declare module '#internal/i18n/options.mjs' {
  import type { DeepRequired } from 'ts-essentials'
  import type { LocaleObject, NuxtI18nOptions, VueI18nConfig } from '@nuxtjs/i18n'

  type LocaleLoader = {
    key: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load: () => Promise<any>
    cache: boolean
  }

  export const localeLoaders: Record<string, LocaleLoader[]>

  export const vueI18nConfigs: VueI18nConfig[]

  export const localeCodes: string[]
  export const nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>>
  export const normalizedLocales: LocaleObject[]
  export const isSSG = false
  export const hasPages: boolean
  export const parallelPlugin: boolean

  export const NUXT_I18N_MODULE_ID = ''
  export const DEFAULT_DYNAMIC_PARAMS_KEY: string
  export const DEFAULT_COOKIE_KEY: string
  export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER: string
}

declare module '#internal/i18n/locale.detector.mjs' {
  import type { LocaleDetector } from '@nuxtjs/i18n/dist/runtime/composables/server'

  export const localeDetector: LocaleDetector
}

declare module '#nuxt-i18n/logger' {
  import type { ConsolaInstance } from 'consola'

  export function createLogger(label: string): ConsolaInstance
}

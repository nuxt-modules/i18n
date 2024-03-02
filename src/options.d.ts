// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NuxtI18nOptions, VueI18nConfig } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { DeepRequired } from 'ts-essentials'

export type * from './types'

/**
 * stub type definition for @nuxtjs/i18n internally
 */

type LocaleLoader = {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<any>
  cache: boolean
}

export const localeLoaders: Record<string, LocaleLoader[]> = {}

export const vueI18nConfigs: VueI18nConfig[]

export const localeCodes: string[] = []
export const nuxtI18nOptions: DeepRequired<NuxtI18nOptions<Context>> = {}
export const normalizedLocales: LocaleObject[] = []
export const isSSG = false
export const parallelPlugin: boolean

export const NUXT_I18N_MODULE_ID = ''
export const DEFAULT_DYNAMIC_PARAMS_KEY: string
export const DEPRECATED_DYNAMIC_PARAMS_KEY: string
export const DEFAULT_COOKIE_KEY: string

export { NuxtI18nOptionsDefault }
export { NuxtI18nOptions, DetectBrowserLanguageOptions, RootRedirectOptions } from './types'

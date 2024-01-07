// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NuxtI18nOptions, NuxtI18nInternalOptions, RootRedirectOptions, VueI18nConfig } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { DeepRequired } from 'ts-essentials'

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
export const nuxtI18nOptionsDefault: NuxtI18nOptionsDefault = {}
export const nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions> = {}
export const NUXT_I18N_MODULE_ID = ''
export const isSSG = false
export const parallelPlugin: boolean

export {
  NuxtI18nOptions,
  NuxtI18nOptionsDefault,
  NuxtI18nInternalOptions,
  DetectBrowserLanguageOptions,
  RootRedirectOptions
} from './types'

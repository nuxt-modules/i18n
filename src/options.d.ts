// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NuxtI18nOptions, VueI18nConfig } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { DeepRequired } from 'ts-essentials'

import * as constants from './constants'

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
export const nuxtI18nOptionsDefault: NuxtI18nOptionsDefault = {}
export const normalizedLocales: LocaleObject[] = []
export const NUXT_I18N_MODULE_ID = ''
export const isSSG = false
export const parallelPlugin: boolean

export const STRATEGIES: typeof constants.STRATEGIES
export const DEFAULT_LOCALE: typeof constants.DEFAULT_LOCALE
export const DEFAULT_STRATEGY: (typeof STRATEGIES)[keyof typeof STRATEGIES]
export const DEFAULT_TRAILING_SLASH: typeof constants.DEFAULT_TRAILING_SLASH
export const DEFAULT_ROUTES_NAME_SEPARATOR: typeof constants.DEFAULT_ROUTES_NAME_SEPARATOR
export const DEFAULT_LOCALE_ROUTE_NAME_SUFFIX: typeof constants.DEFAULT_LOCALE_ROUTE_NAME_SUFFIX
export const DEFAULT_DETECTION_DIRECTION: typeof constants.DEFAULT_DETECTION_DIRECTION
export const DEFAULT_BASE_URL: typeof constants.DEFAULT_BASE_URL
export const DEFAULT_DYNAMIC_PARAMS_KEY: typeof constants.DEFAULT_DYNAMIC_PARAMS_KEY

export {
  NuxtI18nOptions,
  NuxtI18nOptionsDefault,
  DetectBrowserLanguageOptions,
  RootRedirectOptions
} from './types'

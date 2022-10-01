import type { NuxtI18nOptions, NuxtI18nInternalOptions } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { DeepRequired } from 'ts-essentials'

/**
 * stub type definition for nuxt plugin
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadMessages: () => Promise<any> = () => Promise.resolve({})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const localeMessages: Record<string, () => Promise<any>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveNuxtI18nOptions: <Context = unknown>(
  context: Context
) => Promise<DeepRequired<NuxtI18nOptions<Context>>> = () => Promise.resolve({})
export const localeCodes: string[] = []
export const nuxtI18nOptions: DeepRequired<NuxtI18nOptions> = {}
export const nuxtI18nOptionsDefault: NuxtI18nOptionsDefault = {}
export const nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions> = {}

export {
  NuxtI18nOptions,
  NuxtI18nOptionsDefault,
  NuxtI18nInternalOptions,
  DetectBrowserLanguageOptions,
  LanguageSwitchedHandler,
  BeforeLanguageSwitchHandler,
  LanguageSwitchedHandler
} from './types'

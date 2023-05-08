// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NuxtI18nOptions, NuxtI18nInternalOptions, RootRedirectOptions } from './types'
import type { NuxtI18nOptionsDefault } from './constants'
import type { DeepRequired } from 'ts-essentials'

/**
 * stub type definition for @nuxtjs/i18n internally
 */

type LocaleLoader = {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<any>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadMessages: () => Promise<any> = () => Promise.resolve({})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const localeMessages: Record<string, LocaleLoader[]> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const additionalMessages: Record<string, Array<() => Promise<any>>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveNuxtI18nOptions: <Context = unknown>(
  context: Context
) => Promise<DeepRequired<NuxtI18nOptions<Context>>> = () => Promise.resolve({})
export const localeCodes: string[] = []
export const nuxtI18nOptions: DeepRequired<NuxtI18nOptions> = {}
export const nuxtI18nOptionsDefault: NuxtI18nOptionsDefault = {}
export const nuxtI18nInternalOptions: DeepRequired<NuxtI18nInternalOptions> = {}
export const NUXT_I18N_MODULE_ID = ''
export const NUXT_I18N_PRECOMPILE_ENDPOINT = ''
export const NUXT_I18N_PRECOMPILED_LOCALE_KEY = ''
export const NUXT_I18N_PRERENDERED_PATH = '/__i18n__/prerender'
export const NULL_HASH = '00000000' as const
export const isSSG = false

export {
  NuxtI18nOptions,
  NuxtI18nOptionsDefault,
  NuxtI18nInternalOptions,
  DetectBrowserLanguageOptions,
  RootRedirectOptions
} from './types'

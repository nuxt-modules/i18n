import Vue from 'vue'
import { ComponentOptions } from 'vue/types/options'
import { STRATEGIES } from '../helpers/constants'
import { LocaleFileImport, ResolvedOptions } from '../../types'

interface ModuleConstants {
  COMPONENT_OPTIONS_KEY: keyof Pick<ComponentOptions<Vue>, 'nuxtI18n'>
  LOCALE_CODE_KEY: string
  LOCALE_DIR_KEY: string
  LOCALE_DOMAIN_KEY: string
  LOCALE_FILE_KEY: string
  LOCALE_ISO_KEY: string
  MODULE_NAME: string
  STRATEGIES: typeof STRATEGIES
}

interface ModuleNuxtOptions {
  isUniversalMode: boolean
  trailingSlash: boolean | undefined
}

export const asyncLocales: Record<string, () => Promise<LocaleFileImport>>
export const Constants: ModuleConstants
export const localeCodes: readonly string[]
export const nuxtOptions: ModuleNuxtOptions
export const options: ResolvedOptions

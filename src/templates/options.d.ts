import Vue from 'vue'
import { ComponentOptions } from 'vue/types/options'
import { STRATEGIES, REDIRECT_ON_OPTIONS } from '../helpers/constants'
import { LocaleFileExport, ResolvedOptions } from '../../types/internal'

interface ModuleConstants {
  COMPONENT_OPTIONS_KEY: keyof Pick<ComponentOptions<Vue>, 'nuxtI18n'>
  STRATEGIES: typeof STRATEGIES
  REDIRECT_ON_OPTIONS: typeof REDIRECT_ON_OPTIONS
}

interface ModuleNuxtOptions {
  isUniversalMode: boolean
  trailingSlash: boolean | undefined
}

export const localeMessages: Record<string, () => Promise<LocaleFileExport>>
export const Constants: ModuleConstants
export const nuxtOptions: ModuleNuxtOptions
export const options: ResolvedOptions

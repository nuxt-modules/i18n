import Vue from 'vue'
import { ComponentOptions } from 'vue/types/options'
import { STRATEGIES } from '../helpers/constants'
import { LocaleFileExport, ResolvedOptions } from '../../types/internal'

interface ModuleConstants {
  COMPONENT_OPTIONS_KEY: keyof Pick<ComponentOptions<Vue>, 'nuxtI18n'>
  STRATEGIES: typeof STRATEGIES
}

interface ModuleNuxtOptions {
  isUniversalMode: boolean
  trailingSlash: boolean | undefined
}

export const localeMessages: Record<string, () => Promise<LocaleFileExport>>
export const Constants: ModuleConstants
export const nuxtOptions: ModuleNuxtOptions
export const options: ResolvedOptions

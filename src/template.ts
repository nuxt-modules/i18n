import { generateLoaderOptions } from './gen'
import {
  STRATEGIES,
  DEFAULT_LOCALE,
  DEFAULT_TRAILING_SLASH,
  DEFAULT_ROUTES_NAME_SEPARATOR,
  DEFAULT_BASE_URL,
  DEFAULT_DETECTION_DIRECTION,
  DEFAULT_DYNAMIC_PARAMS_KEY,
  DEFAULT_LOCALE_ROUTE_NAME_SUFFIX,
  DEFAULT_STRATEGY,
  NUXT_I18N_MODULE_ID
} from './constants'
import type { LocaleObject } from './types'

export type TemplateNuxtI18nOptions = {
  localeCodes: string[]
  normalizedLocales: LocaleObject[]
  dev: boolean
  isSSG: boolean
  parallelPlugin: boolean
} & ReturnType<typeof generateLoaderOptions>

export function generateTemplateNuxtI18nOptions(options: TemplateNuxtI18nOptions): string {
  return `
// @ts-nocheck
${options.importStrings.length > 0 ? options.importStrings.join('\n') + '\n' : ''}

export const localeCodes =  ${JSON.stringify(options.localeCodes, null, 2)}

export const localeLoaders = {
${options.localeLoaders
  .map(([key, val]) => {
    return `  "${key}": [${val
      .map(
        (entry: { key: string; load: string; cache: boolean }) =>
          `{ key: ${entry.key}, load: ${entry.load}, cache: ${entry.cache} }`
      )
      .join(',\n')}]`
  })
  .join(',\n')}
}

export const vueI18nConfigs = [
  ${options.vueI18nConfigs.length > 0 ? options.vueI18nConfigs.join(',\n  ') : ''}
]

export const nuxtI18nOptions = ${JSON.stringify(options.nuxtI18nOptions, null, 2)}

export const normalizedLocales = ${JSON.stringify(options.normalizedLocales, null, 2)}

export const NUXT_I18N_MODULE_ID = "${NUXT_I18N_MODULE_ID}"
export const parallelPlugin = ${options.parallelPlugin}
export const isSSG = ${options.isSSG}

export const STRATEGIES = ${JSON.stringify(STRATEGIES, null, 2)}
export const DEFAULT_LOCALE = ${JSON.stringify(DEFAULT_LOCALE)}
export const DEFAULT_STRATEGY = ${JSON.stringify(DEFAULT_STRATEGY)}
export const DEFAULT_TRAILING_SLASH = ${JSON.stringify(DEFAULT_TRAILING_SLASH)}
export const DEFAULT_ROUTES_NAME_SEPARATOR = ${JSON.stringify(DEFAULT_ROUTES_NAME_SEPARATOR)}
export const DEFAULT_LOCALE_ROUTE_NAME_SUFFIX = ${JSON.stringify(DEFAULT_LOCALE_ROUTE_NAME_SUFFIX)}
export const DEFAULT_DETECTION_DIRECTION = ${JSON.stringify(DEFAULT_DETECTION_DIRECTION)}
export const DEFAULT_BASE_URL = ${JSON.stringify(DEFAULT_BASE_URL)}
export const DEFAULT_DYNAMIC_PARAMS_KEY = ${JSON.stringify(DEFAULT_DYNAMIC_PARAMS_KEY)}
`
}

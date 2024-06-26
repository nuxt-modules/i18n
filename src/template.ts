import { generateLoaderOptions } from './gen'
import {
  DEFAULT_DYNAMIC_PARAMS_KEY,
  DEFAULT_COOKIE_KEY,
  NUXT_I18N_MODULE_ID,
  SWITCH_LOCALE_PATH_LINK_IDENTIFIER
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
    // @ts-expect-error -- FIXME
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call -- FIXME
    return `  "${key}": [${val
      // @ts-expect-error -- FIXME
      .map(
        (entry: { key: string; load: string; cache: boolean }) =>
          `{ key: ${entry.key}, load: ${entry.load}, cache: ${entry.cache} }`
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- FIXME
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

export const DEFAULT_DYNAMIC_PARAMS_KEY = ${JSON.stringify(DEFAULT_DYNAMIC_PARAMS_KEY)}
export const DEFAULT_COOKIE_KEY = ${JSON.stringify(DEFAULT_COOKIE_KEY)}
export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = ${JSON.stringify(SWITCH_LOCALE_PATH_LINK_IDENTIFIER)}
`
}

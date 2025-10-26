import { loadVueI18nOptions } from './messages'
import { localeCodes as _localeCodes, vueI18nConfigs } from '#build/i18n-options.mjs'

import type { I18nOptions } from 'vue-i18n'

type RequireProps<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type ResolvedI18nOptions = RequireProps<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'> & {
  defaultLocale: string
}

export const setupVueI18nOptions = async (defaultLocale: string): Promise<ResolvedI18nOptions> => {
  const options = (await loadVueI18nOptions(vueI18nConfigs)) as ResolvedI18nOptions

  options.locale = defaultLocale || options.locale || 'en-US'
  options.defaultLocale = defaultLocale
  options.fallbackLocale ??= false
  options.messages ??= {}

  // initialize locale objects to make vue-i18n aware of available locales
  for (const locale of _localeCodes) {
    options.messages[locale] ??= {}
  }

  return options
}

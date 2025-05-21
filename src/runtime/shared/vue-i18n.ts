import { loadVueI18nOptions } from './messages'
import { vueI18nConfigs, localeCodes as _localeCodes } from '#build/i18n.options.mjs'

import type { I18nOptions } from 'vue-i18n'

type ResolvedI18nOptions = Omit<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'> &
  Required<Pick<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'>>

export const setupVueI18nOptions = async (defaultLocale: string): Promise<ResolvedI18nOptions> => {
  const options = await loadVueI18nOptions(vueI18nConfigs)

  options.locale = defaultLocale || options.locale || 'en-US'
  options.fallbackLocale ??= false
  options.messages ??= {}

  // initialize locale objects to make vue-i18n aware of available locales
  for (const locale of _localeCodes) {
    options.messages[locale] ??= {}
  }

  return options as ResolvedI18nOptions
}

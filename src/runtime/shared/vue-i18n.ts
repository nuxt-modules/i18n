import { useRuntimeConfig } from '#app'
import { loadVueI18nOptions } from './messages'
import { vueI18nConfigs, localeCodes as _localeCodes } from '#build/i18n.options.mjs'

import type { I18nOptions } from 'vue-i18n'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

type ResolvedI18nOptions = Omit<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'> &
  Required<Pick<I18nOptions, 'messages' | 'locale' | 'fallbackLocale'>>

export const setupVueI18nOptions = async (): Promise<ResolvedI18nOptions> => {
  const runtimeI18n = useRuntimeConfig().public.i18n as unknown as I18nPublicRuntimeConfig
  const options = await loadVueI18nOptions(vueI18nConfigs)

  options.locale = runtimeI18n.defaultLocale || options.locale || 'en-US'
  options.fallbackLocale = options.fallbackLocale ?? false

  options.messages ??= {}
  for (const locale of _localeCodes) {
    options.messages[locale] ??= {}
  }

  return options as ResolvedI18nOptions
}

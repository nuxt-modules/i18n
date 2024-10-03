import { deepCopy } from '@intlify/shared'
// @ts-ignore
import { defineEventHandler } from '#imports'
import { vueI18nConfigs, localeLoaders } from '#internal/i18n/options.mjs'

import type { I18nOptions, Locale, LocaleMessages } from 'vue-i18n'
import { loadLocale, loadVueI18nOptions } from '../../messages'
import { nuxtMock } from '../utils'
import type { DefineLocaleMessage } from '@intlify/h3'

export default defineEventHandler(async () => {
  const messages = {}
  const datetimeFormats = {}
  const numberFormats = {}

  const vueI18nConfig = await loadVueI18nOptions(vueI18nConfigs, nuxtMock)
  for (const locale in vueI18nConfig.messages) {
    deepCopy(vueI18nConfig.messages[locale] || {}, messages)
  }
  deepCopy(vueI18nConfig.numberFormats || {}, numberFormats)
  deepCopy(vueI18nConfig.datetimeFormats || {}, datetimeFormats)

  // @ts-ignore
  const _defineI18nLocale = globalThis.defineI18nLocale
  // @ts-ignore
  globalThis.defineI18nLocale = val => val

  for (const code in localeLoaders) {
    const setter = (_: Locale, message: LocaleMessages<DefineLocaleMessage, Locale>) => {
      deepCopy(message, messages)
    }

    await loadLocale(code, localeLoaders, setter)
  }

  // @ts-ignore
  globalThis.defineI18nLocale = _defineI18nLocale

  return {
    messages,
    numberFormats,
    datetimeFormats
  }
})

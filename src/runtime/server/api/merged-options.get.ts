import { deepCopy } from '@intlify/shared'
// @ts-ignore
import { defineEventHandler } from '#imports'
import { vueI18nConfigs, localeLoaders, nuxtI18nOptions, normalizedLocales } from '#internal/i18n/options.mjs'

import type { Locale, LocaleMessages } from 'vue-i18n'
import { loadLocale, loadVueI18nOptions } from '../../messages'
import { nuxtMock } from '../utils'
import type { DefineLocaleMessage } from '@intlify/h3'

export default defineEventHandler(async () => {
  const messages = {}
  const datetimeFormats = {}
  const numberFormats = {}

  const targetLocales: string[] = []
  if (nuxtI18nOptions.experimental.typedOptionsAndMessages === 'default' && nuxtI18nOptions.defaultLocale != null) {
    targetLocales.push(nuxtI18nOptions.defaultLocale)
  } else if (nuxtI18nOptions.experimental.typedOptionsAndMessages === 'all') {
    targetLocales.push(...normalizedLocales.map(x => x.code))
  }

  const vueI18nConfig = await loadVueI18nOptions(vueI18nConfigs, nuxtMock)
  for (const locale in vueI18nConfig.messages) {
    if (!targetLocales.includes(locale)) continue
    deepCopy(vueI18nConfig.messages[locale] || {}, messages)
    deepCopy(vueI18nConfig.numberFormats?.[locale] || {}, numberFormats)
    deepCopy(vueI18nConfig.datetimeFormats?.[locale] || {}, datetimeFormats)
  }

  // @ts-ignore
  const _defineI18nLocale = globalThis.defineI18nLocale
  // @ts-ignore
  globalThis.defineI18nLocale = val => val

  for (const locale in localeLoaders) {
    if (!targetLocales.includes(locale)) continue

    const setter = (_: Locale, message: LocaleMessages<DefineLocaleMessage, Locale>) => {
      deepCopy(message, messages)
    }

    await loadLocale(locale, localeLoaders, setter, nuxtMock)
  }

  // @ts-ignore
  globalThis.defineI18nLocale = _defineI18nLocale

  return {
    messages,
    numberFormats,
    datetimeFormats
  }
})

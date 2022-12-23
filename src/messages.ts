import createDebug from 'debug'
import { isString, isArray, isObject, hasOwn } from '@intlify/shared'

import type { Nuxt } from '@nuxt/schema'
import type { DefineLocaleMessage, FallbackLocale, Locale, LocaleMessages } from 'vue-i18n'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:messages')

export type AdditionalMessages = Record<Locale, DefineLocaleMessage[]>

export async function extendMessages(
  nuxt: Nuxt,
  localeCodes: string[],
  nuxtOptions: Required<NuxtI18nOptions>
): Promise<AdditionalMessages> {
  const additionalMessages: LocaleMessages<DefineLocaleMessage>[] = []
  await nuxt.callHook('i18n:extend-messages', additionalMessages, localeCodes)
  debug('i18n:extend-messages additional messages', additionalMessages)

  return normalizeMessages(additionalMessages, localeCodes, nuxtOptions)
}

const isNotObjectOrIsArray = (val: unknown) => !isObject(val) || isArray(val)

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function deepCopy(src: Record<string, any>, des: Record<string, any>): void {
  for (const key in src) {
    if (hasOwn(src, key)) {
      if (isNotObjectOrIsArray(src[key]) || isNotObjectOrIsArray(des[key])) {
        des[key] = src[key]
      } else {
        deepCopy(src[key], des[key])
      }
    }
  }
}

function getLocaleCodes(fallback: FallbackLocale, locales: Locale[]): Locale[] {
  let fallbackLocales: string[] = []
  if (isArray(fallback)) {
    fallbackLocales = fallback
  } else if (isObject(fallback)) {
    const targets = [...locales, 'default']
    for (const locale of targets) {
      if (fallback[locale]) {
        fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)]
      }
    }
  } else if (isString(fallback) && locales.every(locale => locale !== fallback)) {
    fallbackLocales.push(fallback)
  }
  return fallbackLocales
}

async function normalizeMessages(
  additional: LocaleMessages<DefineLocaleMessage>[],
  localeCodes: string[],
  nuxtOptions: Required<NuxtI18nOptions>
) {
  /**
   * merge additional messages into vueI18n messages
   */

  let targetLocaleCodes = [...localeCodes]
  if (isObject(nuxtOptions.vueI18n)) {
    nuxtOptions.vueI18n.messages = nuxtOptions.vueI18n.messages || {}
    const locale = nuxtOptions.defaultLocale || nuxtOptions.vueI18n.locale || 'en-US'
    const locales = nuxtOptions.vueI18n.fallbackLocale
      ? getLocaleCodes(nuxtOptions.vueI18n.fallbackLocale, [locale])
      : [locale]
    for (const locale of locales) {
      nuxtOptions.vueI18n.messages[locale] = nuxtOptions.vueI18n.messages[locale] || {}
    }
    for (const [, messages] of Object.entries(additional)) {
      for (const locale of locales) {
        deepCopy(messages[locale], nuxtOptions.vueI18n.messages[locale])
      }
    }
    targetLocaleCodes = localeCodes.filter(code => !locales.includes(code))
    debug('vueI18n messages', nuxtOptions.vueI18n.messages)
  }

  /**
   * collect additional messages for each locale
   */

  const additionalMessages: AdditionalMessages = {}
  for (const localeCode of targetLocaleCodes) {
    additionalMessages[localeCode] = []
  }

  for (const [, messages] of Object.entries(additional)) {
    for (const [locale, message] of Object.entries(messages)) {
      if (targetLocaleCodes.includes(locale)) {
        additionalMessages[locale].push(message)
      }
    }
  }

  return additionalMessages
}

import createDebug from 'debug'

import type { Nuxt } from '@nuxt/schema'
import type { DefineLocaleMessage, Locale, LocaleMessages } from 'vue-i18n'

const debug = createDebug('@nuxtjs/i18n:messages')

export type AdditionalMessages = Record<Locale, DefineLocaleMessage[]>

export async function extendMessages(nuxt: Nuxt, localeCodes: string[]): Promise<AdditionalMessages> {
  const additionalMessages: LocaleMessages<DefineLocaleMessage>[] = []
  await nuxt.callHook('i18n:extend-messages', additionalMessages, localeCodes)
  debug('i18n:extend-messages additional messages', additionalMessages)

  return normalizeAdditionalMessages(additionalMessages, localeCodes)
}

async function normalizeAdditionalMessages(additional: LocaleMessages<DefineLocaleMessage>[], localeCodes: string[]) {
  const additionalMessages: AdditionalMessages = {}
  for (const localeCode of localeCodes) {
    additionalMessages[localeCode] = []
  }

  for (const [, messages] of Object.entries(additional)) {
    for (const [locale, message] of Object.entries(messages)) {
      additionalMessages[locale].push(message)
    }
  }

  return additionalMessages
}

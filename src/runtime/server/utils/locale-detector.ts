import { fetchMessages } from '../context'
import { deepCopy } from '@intlify/shared'
import { localeDetector } from '#internal/i18n-locale-detector.mjs'

import type { H3Event } from 'h3'
import type { CoreOptions, FallbackLocale, Locale } from '@intlify/core'

export function createUserLocaleDetector(defaultLocale: string, fallbackLocale: FallbackLocale) {
  return async (event: H3Event, i18nCtx: CoreOptions): Promise<Locale> => {
    const locale = localeDetector!(event, { defaultLocale, fallbackLocale })

    // Merge messages into i18n context which contains unserializable messages from vue-i18n configurations
    const messages = await fetchMessages(locale)
    for (const locale of Object.keys(messages)) {
      i18nCtx.messages![locale] ??= {}
      deepCopy(messages[locale], i18nCtx.messages![locale])
    }

    return locale
  }
}

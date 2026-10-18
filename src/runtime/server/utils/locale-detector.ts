import { fetchMessages, tryUseI18nContext } from '../context'
import { deepCopy } from '@intlify/shared'
import { localeDetector } from '#internal/i18n-locale-detector.mjs'

import type { ServerEvent } from '#i18n-server-runtime'
import type { CoreOptions, FallbackLocale, Locale } from '@intlify/core'

export function createUserLocaleDetector(defaultLocale: string, fallbackLocale: FallbackLocale) {
  return async (event: ServerEvent, i18nCtx: CoreOptions): Promise<Locale> => {
    const locale = localeDetector!(event, { defaultLocale, fallbackLocale })

    // Merge messages into i18n context which contains unserializable messages from vue-i18n
    // configurations - read in-process, `$fetch` would serialize message functions away (#3880)
    const messages = await (tryUseI18nContext(event)?.loadMessages(locale) ?? fetchMessages(event, locale))
    for (const locale of Object.keys(messages)) {
      i18nCtx.messages![locale] ??= {}
      deepCopy(messages[locale], i18nCtx.messages![locale])
    }

    return locale
  }
}

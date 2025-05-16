import { localeCodes } from '#build/i18n.options.mjs'
import { getFallbackLocaleCodes } from './messages'
import { isLocaleWithFallbacksCacheable } from './cache'
import type { FallbackLocale } from 'vue-i18n'

type LocaleConfig = { cacheable: boolean; fallbacks: string[] }
export function createLocaleConfigs(fallbackLocale: FallbackLocale): Record<string, LocaleConfig> {
  const localeConfigs: Record<string, LocaleConfig> = {}

  for (const locale of localeCodes) {
    const fallbacks = getFallbackLocaleCodes(fallbackLocale, [locale])
    const cacheable = isLocaleWithFallbacksCacheable(locale, fallbacks)
    localeConfigs[locale] = { fallbacks, cacheable }
  }

  return localeConfigs
}

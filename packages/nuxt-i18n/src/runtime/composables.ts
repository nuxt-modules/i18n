import { useRequestHeaders } from '#app'
import { findBrowserLocale } from 'vue-i18n-routing'
import { parseAcceptLanguage } from '#build/i18n.utils.mjs'
import { nuxtI18nOptions } from '#build/i18n.options.mjs'

import type { NuxtI18nInternalOptions } from '#build/i18n.options.mjs'

export * from '@intlify/vue-i18n-bridge'

export {
  localePath,
  localeLocation,
  localeRoute,
  localeHead,
  switchLocalePath,
  getRouteBaseName,
  useLocalePath,
  useLocaleLocation,
  useLocaleRoute,
  useLocaleHead,
  useSwitchLocalePath,
  useRouteBaseName
} from 'vue-i18n-routing'

const nuxtI18nOptionsInternal = nuxtI18nOptions as unknown as Required<NuxtI18nInternalOptions>

export function useBrowserLocale(normalizedLocales = nuxtI18nOptionsInternal.__normalizedLocales): string | null {
  const headers = useRequestHeaders(['accept-language'])
  return (
    findBrowserLocale(
      normalizedLocales,
      process.client ? (navigator.languages as string[]) : parseAcceptLanguage(headers['accept-language'])
    ) || null
  )
}

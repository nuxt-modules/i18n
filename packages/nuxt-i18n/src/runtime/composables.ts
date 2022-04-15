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
  let ret: string | null = null

  if (process.client) {
    // get browser language either from navigator if running on client side, or from the headers
    ret = findBrowserLocale(normalizedLocales, navigator.languages as string[])
  } else {
    const headers = useRequestHeaders(['accept-language'])
    if (headers['accept-language']) {
      ret = findBrowserLocale(normalizedLocales, parseAcceptLanguage(headers['accept-language']))
    }
  }

  return ret
}

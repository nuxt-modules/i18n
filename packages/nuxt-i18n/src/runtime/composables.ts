import { ref } from 'vue-demi'
import { useRequestHeaders, useCookie as _useCookie } from '#app'
import { findBrowserLocale } from 'vue-i18n-routing'
import { parseAcceptLanguage } from '#build/i18n.internal.mjs'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault, localeCodes as _localeCodes } from '#build/i18n.options.mjs'
import { isClient, isServer } from '#build/i18n.utils.mjs'

import type { Ref } from 'vue-demi'
import type { DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'

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

export function useBrowserLocale(normalizedLocales = nuxtI18nInternalOptions.__normalizedLocales): string | null {
  const headers = useRequestHeaders(['accept-language'])
  return (
    findBrowserLocale(
      normalizedLocales,
      isClient() ? (navigator.languages as string[]) : parseAcceptLanguage(headers['accept-language'])
    ) || null
  )
}

export function useCookieLocale({
  useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
  cookieKey = nuxtI18nOptionsDefault.detectBrowserLanguage.cookieKey,
  localeCodes = _localeCodes
}: Pick<DetectBrowserLanguageOptions, 'useCookie' | 'cookieKey'> & {
  localeCodes: readonly string[]
}): Ref<string> {
  const locale: Ref<string> = ref('')

  if (useCookie) {
    let code: string | null = null
    if (isClient()) {
      const cookie = _useCookie<string>(cookieKey) as Ref<string>
      code = cookie.value
    } else if (isServer()) {
      const cookie = useRequestHeaders(['cookie'])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code = (cookie as any)[cookieKey]
    }

    if (code && localeCodes.includes(code)) {
      locale.value = code
    }
  }

  return locale
}

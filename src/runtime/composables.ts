import { ref } from 'vue-demi'
import { findBrowserLocale } from 'vue-i18n-routing'
import { useRoute, useRouter, useRequestHeaders, useCookie as _useCookie } from '#imports'
import { parseAcceptLanguage } from '#build/i18n.internal.mjs'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault, localeCodes as _localeCodes } from '#build/i18n.options.mjs'
import { useI18n } from '@intlify/vue-i18n-bridge'
import {
  useRouteBaseName as _useRouteBaseName,
  useLocalePath as _useLocalePath,
  useLocaleRoute as _useLocaleRoute,
  useSwitchLocalePath as _useSwitchLocalePath,
  useLocaleHead as _useLocaleHead
} from 'vue-i18n-routing'

import type { Ref } from 'vue-demi'
import type { DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'

export * from '@intlify/vue-i18n-bridge'
export type { LocaleObject } from 'vue-i18n-routing'

export function useRouteBaseName(
  route: NonNullable<Parameters<typeof _useRouteBaseName>[0]> = useRoute()
): ReturnType<typeof _useRouteBaseName> {
  const router = useRouter()
  return _useRouteBaseName(route, { router })
}

export function useLocalePath({
  i18n = useI18n()
}: Pick<NonNullable<Parameters<typeof _useLocalePath>[0]>, 'i18n'> = {}): ReturnType<typeof _useLocalePath> {
  const route = useRoute()
  const router = useRouter()
  return _useLocalePath({
    router,
    route,
    i18n
  })
}

export function useLocaleRoute({
  i18n = useI18n()
}: Pick<NonNullable<Parameters<typeof _useLocaleRoute>[0]>, 'i18n'> = {}): ReturnType<typeof _useLocaleRoute> {
  const route = useRoute()
  const router = useRouter()
  return _useLocaleRoute({
    router,
    route,
    i18n
  })
}

export function useSwitchLocalePath({
  i18n = useI18n()
}: Pick<NonNullable<Parameters<typeof _useSwitchLocalePath>[0]>, 'i18n'> = {}): ReturnType<
  typeof _useSwitchLocalePath
> {
  const route = useRoute()
  const router = useRouter()
  return _useSwitchLocalePath({
    router,
    route,
    i18n
  })
}

export function useLocaleHead({
  addDirAttribute = false,
  addSeoAttributes = false,
  i18n = useI18n()
}: Pick<
  NonNullable<Parameters<typeof _useLocaleHead>[0]>,
  'i18n' | 'addDirAttribute' | 'addSeoAttributes'
> = {}): ReturnType<typeof _useLocaleHead> {
  const route = useRoute()
  const router = useRouter()
  return _useLocaleHead({
    addDirAttribute,
    addSeoAttributes,
    router,
    route,
    i18n
  })
}

export function useBrowserLocale(normalizedLocales = nuxtI18nInternalOptions.__normalizedLocales): string | null {
  const headers = useRequestHeaders(['accept-language'])
  return (
    findBrowserLocale(
      normalizedLocales,
      process.client ? (navigator.languages as string[]) : parseAcceptLanguage(headers['accept-language'] || '')
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
    if (process.client) {
      const cookie = _useCookie<string>(cookieKey) as Ref<string>
      code = cookie.value
    } else if (process.server) {
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

import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import type { I18nPublicRuntimeConfig } from '../types'
import { DEFAULT_OPTIONS } from '../constants'
import { defu } from 'defu'
import { simplifyLocaleOptions } from '../gen'
import { assign } from '@intlify/shared'

export function prepareRuntimeConfig({ options }: I18nNuxtContext, nuxt: Nuxt) {
  // @ts-expect-error generated type
  nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
    baseUrl: options.baseUrl,
    defaultLocale: options.defaultLocale,
    rootRedirect: options.rootRedirect,
    skipSettingLocaleOnNavigate: options.skipSettingLocaleOnNavigate,
    locales: options.locales,
    detectBrowserLanguage: options.detectBrowserLanguage ?? DEFAULT_OPTIONS.detectBrowserLanguage,
    experimental: options.experimental,
    domainLocales: {} as I18nPublicRuntimeConfig['domainLocales']
  })

  nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(nuxt, assign({}, options))
}

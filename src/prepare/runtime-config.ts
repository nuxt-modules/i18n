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
    defaultDirection: options.defaultDirection,
    strategy: options.strategy,
    lazy: options.lazy,
    rootRedirect: options.rootRedirect,
    routesNameSeparator: options.routesNameSeparator,
    defaultLocaleRouteNameSuffix: options.defaultLocaleRouteNameSuffix,
    skipSettingLocaleOnNavigate: options.skipSettingLocaleOnNavigate,
    differentDomains: options.differentDomains,
    trailingSlash: options.trailingSlash,
    locales: options.locales,
    detectBrowserLanguage: options.detectBrowserLanguage ?? DEFAULT_OPTIONS.detectBrowserLanguage,
    experimental: options.experimental,
    multiDomainLocales: options.multiDomainLocales,
    domainLocales: {} as I18nPublicRuntimeConfig['domainLocales']
    // TODO: we should support more i18n module options. welcome PRs :-)
  })

  nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(nuxt, assign({}, options))
}

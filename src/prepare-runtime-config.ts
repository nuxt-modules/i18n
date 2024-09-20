import type { I18nNuxtContext } from './context'
import type { Nuxt } from '@nuxt/schema'
import { DEFAULT_OPTIONS } from './constants'
import { defu } from 'defu'

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
    multiDomainLocales: options.multiDomainLocales
    // TODO: we should support more i18n module options. welcome PRs :-)
  })
}

import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import type { I18nPublicRuntimeConfig } from '../types'
import { DEFAULT_OPTIONS } from '../constants'
import { defu } from 'defu'
import { simplifyLocaleOptions } from '../gen'

export function prepareRuntimeConfig(ctx: I18nNuxtContext, nuxt: Nuxt) {
  // @ts-expect-error generated type
  nuxt.options.runtimeConfig.public.i18n = defu(nuxt.options.runtimeConfig.public.i18n, {
    baseUrl: ctx.options.baseUrl,
    defaultLocale: ctx.options.defaultLocale,
    rootRedirect: ctx.options.rootRedirect,
    redirectStatusCode: ctx.options.redirectStatusCode,
    skipSettingLocaleOnNavigate: ctx.options.skipSettingLocaleOnNavigate,
    locales: ctx.options.locales,
    detectBrowserLanguage: ctx.options.detectBrowserLanguage ?? DEFAULT_OPTIONS.detectBrowserLanguage,
    experimental: ctx.options.experimental,
    domainLocales: Object.fromEntries(
      ctx.options.locales.map((l) => {
        if (typeof l === 'string') {
          return [l, { domain: '' }]
        }
        return [l.code, { domain: l.domain ?? '' }]
      }),
    ) as I18nPublicRuntimeConfig['domainLocales'],
  })

  nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(ctx, nuxt)
}

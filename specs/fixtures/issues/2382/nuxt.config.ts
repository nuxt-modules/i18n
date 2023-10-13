import type { LocaleObject } from '#i18n'

const locales = [{ code: 'en', iso: 'en-US', file: 'en-US.json' }] as LocaleObject[]

const defaultLocale = locales[0]

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales,
    defaultLocale: defaultLocale.code,
    langDir: 'locales/',
    lazy: true,
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      fallbackLocale: defaultLocale.code
    }
  }
})

import { NuxtConfig } from '@nuxt/types'

const config: NuxtConfig = {
  buildModules: ['@nuxt/typescript-build'],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'pl', iso: 'pl-PL', name: 'Polish' }
    ],
    defaultLocale: 'en',
    parsePages: true
  }
};

export default config

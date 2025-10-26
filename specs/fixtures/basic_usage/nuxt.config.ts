import { version } from 'nuxt/package.json'

const isVersion4 = version.startsWith('4')

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: [
    '../common',
    `../layers/layer-server`,
    `../layers/layer-lazy`,
    `../layers/layer-vueI18n-options/layer-simple`,
    `../layers/layer-vueI18n-options/layer-simple-secondary`,
    // modules in last layer are installed first
    ...(isVersion4 ? ['../layers/layer-installer-module'] : []),
  ],
  modules: [
    './layer-module',
    ...(!isVersion4 ? ['../layers/layer-installer-module/installer-module'] : []),
    '@nuxtjs/i18n',
  ],
  plugins: [`../plugins/i18nHooks.ts`],
  runtimeConfig: {
    public: {
      runtimeValue: 'Hello from runtime config!',
      longTextTest: false,
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  i18n: {
    baseUrl: 'http://localhost:3000',
    vueI18n: './config/i18n.config.ts',
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    experimental: {
      localeDetector: './localeDetector.ts',
    },
  },
})

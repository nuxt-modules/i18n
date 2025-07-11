import { version } from 'nuxt/package.json'
const isVersion4 = version.startsWith('4')

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [
    './layer-module',
    ...(!isVersion4 ? ['../layers/layer-installer-module/installer-module'] : []),
    '@nuxtjs/i18n'
  ],

  runtimeConfig: {
    public: {
      runtimeValue: 'Hello from runtime config!',
      longTextTest: false
    }
  },

  extends: [
    '../common',
    `../layers/layer-server`,
    `../layers/layer-lazy`,
    `../layers/layer-vueI18n-options/layer-simple`,
    `../layers/layer-vueI18n-options/layer-simple-secondary`,
    // modules in last layer are installed first
    ...(isVersion4 ? ['../layers/layer-installer-module'] : [])
  ],

  plugins: [`../plugins/i18nHooks.ts`],

  i18n: {
    baseUrl: 'http://localhost:3000',
    vueI18n: './config/i18n.config.ts',
    locales: ['en', 'fr'],
    defaultLocale: 'en'
  },

  compatibilityDate: '2025-04-06'
})

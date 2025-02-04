// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['./layer-module', './installer-module', '@nuxtjs/i18n'],
  runtimeConfig: {
    public: {
      runtimeValue: 'Hello from runtime config!',
      longTextTest: false
    }
  },
  extends: [
    `../layers/layer-server`,
    `../layers/layer-lazy`,
    `../layers/layer-vueI18n-options/layer-simple`,
    `../layers/layer-vueI18n-options/layer-simple-secondary`
  ],
  plugins: [`../plugins/i18nHooks.ts`],
  i18n: {
    restructureDir: false,
    baseUrl: 'http://localhost:3000',
    vueI18n: './config/i18n.config.ts',
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    experimental: {
      alternateLinkCanonicalQueries: false,
      autoImportTranslationFunctions: true
    }
    // debug: true,
  }
})

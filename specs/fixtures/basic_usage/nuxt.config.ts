// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['./layer-module', './installer-module', '../../../dist'],
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
    vueI18n: './config/i18n.config.ts',
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    experimental: {
      autoImportTranslationFunctions: true
    }
    // debug: true,
  }
})

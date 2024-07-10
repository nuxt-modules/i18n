// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
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
    vueI18n: './config/i18n.config.ts',
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    experimental: {
      autoImportTranslationFunctions: true
    }
    // debug: true,
  }
})

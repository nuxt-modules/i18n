// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: ['./layer-module', './installer-module', '@nuxtjs/i18n'],
  runtimeConfig: {
    public: {
      runtimeValue: 'Hello from runtime config!',
      longTextTest: false
    }
  },
  extends: [
    `../layers/layer-lazy`,
    `../layers/layer-vueI18n-options/layer-simple`,
    `../layers/layer-vueI18n-options/layer-simple-secondary`
  ],
  plugins: [`../plugins/i18nHooks.ts`],
  i18n: {
    restructureDir: false,
    baseUrl: 'http://localhost:3000',
    vueI18n: './config/i18n.config.ts',
    defaultLocale: 'en',
    experimental: {
      alternateLinkCanonicalQueries: false,
      autoImportTranslationFunctions: true,
      localeDetector: './localeDetector.ts'
    },
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json5',
        name: 'English'
      },
      {
        code: 'ja',
        language: 'ja-JP',
        file: 'ja.yaml',
        name: 'Japanese'
      }
    ]
    // debug: true,
  }
})

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  devtools: { enabled: true },
  features: {
    devLogs: false
  },
  modules: ['./layer-module', '../../../src'],
  vite: {
    // build: {
    //   minify: false
    // },
    resolve: {
      alias: {
        '#i18n': '../src/runtime/composables/index.ts'
      }
    }
  },
  runtimeConfig: {
    public: {
      runtimeValue: 'Hello from runtime config!'
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
    experimental: {
      autoImportTranslationFunctions: true
    },
    vueI18n: './config/i18n.config.ts',
    locales: ['en', 'fr'],
    defaultLocale: 'en'
    // debug: true,
  }
})

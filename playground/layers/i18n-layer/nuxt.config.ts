// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    restructureDir: false,
    langDir: 'locales',
    lazy: true,
    baseUrl: 'http://localhost:3000',
    customRoutes: 'config',
    pages: {
      history: {
        en: '/history',
        fr: '/history-fr',
        nl: '/geschiedenis'
      }
    },
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json',
        // domain: 'localhost',
        name: 'English'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        file: 'fr.json',
        domain: 'layer-fr.example.com',
        name: 'Francais'
      },
      {
        code: 'nl',
        language: 'nl-NL',
        file: 'nl.json',
        // domain: 'localhost',
        name: 'Nederlands'
      }
      //   {
      //     code: 'en-GB',
      //     language: 'en-GB',
      //     files: ['en.json', 'en-GB.json'],
      //     name: 'English (UK)'
      //   },
      //   {
      //     code: 'ja',
      //     language: 'ja-JP',
      //     file: 'ja.json',
      //     domain: 'mydomain.com',
      //     name: 'Japanses'
      //   },
      //   {
      //     code: 'fr',
      //     language: 'fr-FR',
      //     file: 'fr.json',
      //     domain: 'mydomain.fr',
      //     name: 'Français'
      //   }
    ]
  }
})

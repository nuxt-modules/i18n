// import type { NuxtApp } from 'nuxt/dist/app/index'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    langDir: 'locales',
    lazy: false,
    baseUrl: 'http://localhost:3000',
    customRoutes: 'config',
    differentDomains: true,
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
        file: 'en.json',
        domain: 'layer-en.example.com',
        name: 'English'
      },
      {
        code: 'fr',
        file: 'fr.json',
        domain: 'layer-fr.example.com',
        name: 'Francais'
      },
      // {
      //   code: 'nl',
      //   iso: 'nl-NL',
      //   file: 'nl.json',
      //   // domain: 'localhost',
      //   name: 'Nederlands'
      // }
      //   {
      //     code: 'en-GB',
      //     iso: 'en-GB',
      //     files: ['en.json', 'en-GB.json'],
      //     name: 'English (UK)'
      //   },
      //   {
      //     code: 'ja',
      //     iso: 'ja-JP',
      //     file: 'ja.json',
      //     domain: 'mydomain.com',
      //     name: 'Japanses'
      //   },
      //   {
      //     code: 'fr',
      //     iso: 'fr-FR',
      //     file: 'fr.json',
      //     domain: 'mydomain.fr',
      //     name: 'Français'
      //   }
    ]
  }
})

// import type { NuxtApp } from 'nuxt/dist/app/index'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    langDir: 'locales',
    lazy: true,
    baseUrl: 'http://localhost:3000',
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
        // domain: 'localhost',
        name: 'Francais'
      },
      {
        code: 'nl',
        language: 'nl-NL',
        file: 'nl.json',
        // domain: 'localhost',
        name: 'Nederlands'
      }
    ]
  }
})

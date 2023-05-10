// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json',
        name: 'Français'
      },
      {
        code: 'nl',
        iso: 'nl-NL',
        file: 'nl.json',
        name: 'Nederlands'
      }
    ]
  }
})

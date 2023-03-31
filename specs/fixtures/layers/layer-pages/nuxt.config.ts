// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      },
      {
        code: 'nl',
        iso: 'nl-NL',
        name: 'Nederlands'
      }
    ],
    vueI18n: {
      messages: {
        en: {
          hello: 'Hello world!'
        },
        fr: {
          hello: 'Bonjour le monde!'
        },
        nl: {
          hello: 'Hallo wereld!'
        }
      }
    }
  }
})

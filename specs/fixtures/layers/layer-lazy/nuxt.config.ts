// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    restructureDir: false,
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        file: 'fr.json',
        name: 'Français'
      },
      {
        code: 'nl',
        language: 'nl-NL',
        file: 'nl.json',
        name: 'Nederlands'
      },
      {
        code: 'be',
        language: 'nl-BE',
        file: 'nl.json',
        name: 'Nederlands (België)'
      },
      {
        code: 'kr',
        language: 'kr-KO',
        file: 'kr.json',
        name: '한국어'
      }
    ],
    customRoutes: 'config',
    pages: {
      'layer-parent': {
        nl: '/layer-ouder'
      },
      'layer-parent/layer-child': {
        nl: '/layer-ouder/layer-kind'
      }
    }
  }
})

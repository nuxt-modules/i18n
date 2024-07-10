// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
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
      },
      {
        code: 'kr',
        iso: 'kr-KO',
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

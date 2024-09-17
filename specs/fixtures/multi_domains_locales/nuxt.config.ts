import CustomModule from './module'

const i18nDomains = ['nuxt-app.localhost', 'fr.nuxt-app.localhost', 'ja.nuxt-app.localhost']

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [CustomModule, '@nuxtjs/i18n'],

  i18n: {
    restructureDir: false,
    lazy: false,
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English',
        domains: i18nDomains,
        defaultForDomains: ['nuxt-app.localhost']
      },
      {
        code: 'no',
        iso: 'no-NO',
        name: 'Norwegian',
        domains: i18nDomains
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        domains: i18nDomains,
        defaultForDomains: ['fr.nuxt-app.localhost']
      },
      {
        code: 'ja',
        iso: 'jp-JA',
        name: 'Japan',
        domains: i18nDomains,
        defaultForDomains: ['ja.nuxt-app.localhost']
      }
    ],
    detectBrowserLanguage: {
      useCookie: true
    }
  }
})

const i18nDomains = ['nuxt-app.localhost', 'fr.nuxt-app.localhost', 'ja.nuxt-app.localhost']

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['../common'],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'en',
        language: 'en',
        name: 'English',
        domains: i18nDomains,
        defaultForDomains: ['nuxt-app.localhost']
      },
      {
        code: 'no',
        language: 'no-NO',
        name: 'Norwegian',
        domains: i18nDomains
      },
      {
        code: 'fr',
        language: 'fr-FR',
        name: 'Français',
        domains: i18nDomains,
        defaultForDomains: ['fr.nuxt-app.localhost']
      },
      {
        code: 'ja',
        language: 'jp-JA',
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

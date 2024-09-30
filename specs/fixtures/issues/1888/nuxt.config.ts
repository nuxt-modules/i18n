// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    restructureDir: false,
    locales: [
      {
        code: 'en',
        flag: 'us',
        language: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      { code: 'pl', flag: 'pl', language: 'pl-PL', file: 'pl.json', name: 'Polski' },
      {
        code: 'fr',
        flag: 'fr',
        language: 'fr-FR',
        file: 'fr.json',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    compilation: {
      strictMessage: false
    },
    detectBrowserLanguage: {
      useCookie: true,
      // cookieKey: 'locale',
      // fallbackLocale: 'en',
      alwaysRedirect: true,
      redirectOn: 'root'
    }
  }
})

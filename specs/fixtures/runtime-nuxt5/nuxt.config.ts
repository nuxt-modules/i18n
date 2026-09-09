export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'fr', file: 'fr.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      redirectOn: 'root',
      alwaysRedirect: true
    },
    experimental: {
      preload: process.env.I18N_PRELOAD !== 'false',
      stripMessagesPayload: false
    }
  }
})

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      {
        code: 'en',
        flag: 'us',
        iso: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      { code: 'pl', flag: 'pl', iso: 'pl-PL', file: 'pl.json', name: 'Polski' },
      {
        code: 'fr',
        flag: 'fr',
        iso: 'fr-FR',
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

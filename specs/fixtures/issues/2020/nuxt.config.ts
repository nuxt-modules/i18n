// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    vueI18n: './i18n.config.ts', // if you are using custom path, default
    locales: [
      {
        code: 'fr',
        name: 'Français',
        iso: 'fr-BE'
      },
      {
        code: 'en',
        name: 'English',
        iso: 'en-US'
      }
    ],
    dynamicRouteParams: true,
    defaultLocale: 'fr',
    strategy: 'prefix'
  }
})

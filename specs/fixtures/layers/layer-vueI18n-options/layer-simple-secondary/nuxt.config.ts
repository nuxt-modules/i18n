// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: ['fr', 'nl', 'en'],
    defaultLocale: 'nl',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts'
  }
})

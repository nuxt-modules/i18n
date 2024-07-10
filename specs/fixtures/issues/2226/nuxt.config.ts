export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    strategy: 'prefix_and_default'
  }
})

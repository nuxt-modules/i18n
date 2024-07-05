// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  devtools: { enabled: false },
  modules: ['./modules/i18n-module']
})

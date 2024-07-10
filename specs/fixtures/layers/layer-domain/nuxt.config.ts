// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  i18n: {
    // lazy: false,
    // differentDomains: true,
    // defaultLocale: 'en',
    // strategy: 'prefix_except_default',
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        domain: 'layer-en.example.com',
        name: 'English'
      },
      {
        code: 'nl',
        iso: 'nl-NL',
        file: 'nl.json',
        domain: 'layer-nl.example.com',
        name: 'Nederlands'
      },
      {
        code: 'ja',
        iso: 'ja',
        file: 'ja.json',
        domain: 'layer-ja.example.com',
        name: 'Japanese'
      }
    ]
  }
})

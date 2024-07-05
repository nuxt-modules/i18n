// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  i18n: {
    experimental: {
      localeDetector: './localeDetector.ts'
    },
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json5',
        name: 'English'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'ja.yaml',
        name: 'Japanese'
      }
    ]
  }
})

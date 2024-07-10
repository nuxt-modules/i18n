import i18nModule from '../external_module/i18n-module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  modules: [
    i18nModule,
    [
      '@nuxtjs/i18n',
      {
        // debug: false,
        lazy: false,
        langDir: 'lang',
        defaultLocale: 'en',
        detectBrowserLanguage: false,
        locales: [
          {
            code: 'en',
            iso: 'en-US',
            file: 'locale-file-en.json',
            name: 'English'
          }
        ],
        experimental: {
          localeDetector: './locale-detector.ts'
        }
      }
    ]
  ],
  debug: false,
  i18n: {
    locales: [
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'locale-file-ja.json',
        name: 'Japanese'
      }
    ]
  }
})

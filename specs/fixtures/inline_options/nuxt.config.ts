import i18nModule from '../external_module/i18n-module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [
    i18nModule,
    [
      '@nuxtjs/i18n',
      {
        lazy: false,
        langDir: 'lang',
        defaultLocale: 'en',
        detectBrowserLanguage: false,
        locales: [
          {
            code: 'en',
            language: 'en-US',
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
  i18n: {
    restructureDir: false,
    locales: [
      {
        code: 'ja',
        language: 'ja-JP',
        file: 'locale-file-ja.json',
        name: 'Japanese'
      }
    ]
  }
})

import i18nModule from '../external_module/i18n-module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
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
        ]
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

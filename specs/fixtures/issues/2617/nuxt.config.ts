// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [
    [
      '@nuxtjs/i18n',
      {
        debug: false,
        lazy: false,
        langDir: 'lang',
        defaultLocale: 'en',
        detectBrowserLanguage: false,
        locales: [
          {
            code: 'en',
            iso: 'en-US',
            file: 'locale-file-en.json'
          }
        ]
      }
    ]
  ],
  debug: false
})

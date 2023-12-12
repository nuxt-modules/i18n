// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
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

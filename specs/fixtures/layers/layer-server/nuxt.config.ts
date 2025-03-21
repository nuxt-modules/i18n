// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    restructureDir: false,
    experimental: {
      localeDetector: './localeDetector.ts'
    },
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json5',
        name: 'English'
      },
      {
        code: 'ja',
        language: 'ja-JP',
        file: 'ja.yaml',
        name: 'Japanese'
      },
      {
        code: 'nl',
        language: 'nl-NL',
        file: 'nl.ts',
        name: 'Nederlands'
      }
    ]
  }
})

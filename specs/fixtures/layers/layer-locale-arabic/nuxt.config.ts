// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    restructureDir: false,
    langDir: 'locales',
    locales: [
      {
        code: 'ar',
        language: 'ar',
        file: 'ar.json',
        name: 'Arabic',
        dir: 'rtl'
      }
    ]
  }
})

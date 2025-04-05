// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json',
        domain: 'layer-en.example.com',
        name: 'English'
      },
      {
        code: 'nl',
        language: 'nl-NL',
        file: 'nl.json',
        domain: 'layer-nl.example.com',
        name: 'Nederlands'
      },
      {
        code: 'ja',
        language: 'ja',
        file: 'ja.json',
        domain: 'layer-ja.example.com',
        name: 'Japanese'
      }
    ]
  }
})

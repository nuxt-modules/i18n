// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  i18n: {
    lazy: false,
    differentDomains: true,
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
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
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json',
        domain: 'layer-fr.example.com',
        name: 'Français'
      }
    ]
  }
})

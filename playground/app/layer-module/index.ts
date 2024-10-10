import { createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.hook('i18n:registerModule', register => {
      register({
        langDir: resolve('./locales'),
        locales: [
          {
            code: 'en',
            language: 'en-US',
            file: 'en.json',
            name: 'English'
          },
          {
            code: 'fr',
            language: 'fr-FR',
            file: 'fr.json',
            name: 'Francais'
          },
          {
            code: 'nl',
            language: 'nl-NL',
            file: 'nl.json',
            name: 'Nederlands'
          }
        ]
      })
    })
  }
})

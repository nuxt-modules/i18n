import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    nuxt.hook('i18n:registerModule', register => {
      register({
        langDir: './lang',
        locales: [
          {
            code: 'en',
            iso: 'en-US',
            name: 'English'
          },
          {
            code: 'fr',
            iso: 'fr-FR',
            name: 'Francais'
          },
          {
            code: 'nl',
            iso: 'nl-NL',
            name: 'Nederlands'
          },
          {
            code: 'ja',
            iso: 'ja-JP',
            name: 'Japanese'
          }
        ]
      })
    })
  }
})

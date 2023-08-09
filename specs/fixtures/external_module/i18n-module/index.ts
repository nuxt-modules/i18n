import { createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.hook('i18n:registerModule', register => {
      register({
        langDir: resolve('./locales'),
        locales: [
          {
            code: 'fr',
            iso: 'fr-FR',
            file: 'locale-file-module-fr.json',
            name: 'Francais'
          },
          {
            code: 'nl',
            iso: 'nl-NL',
            file: 'locale-file-module-nl.ts',
            name: 'Nederlands'
          }
        ]
      })
    })
  }
})

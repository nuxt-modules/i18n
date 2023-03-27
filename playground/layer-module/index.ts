import { createResolver, defineNuxtModule } from '@nuxt/kit'
import pathe from 'pathe'
import { useRegisterI18nModule } from '../i18n-module-resolver'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    useRegisterI18nModule(nuxt, {
      langDir: resolve('./locales'),
      locales: [
        {
          code: 'en',
          iso: 'en-US',
          file: 'en.json',
          name: 'English'
        },
        {
          code: 'fr',
          iso: 'fr-FR',
          file: 'fr.json',
          name: 'Francais'
        },
        {
          code: 'nl',
          iso: 'nl-NL',
          file: 'nl.json',
          name: 'Nederlands'
        }
      ]
    })
  }
})

import { createResolver, defineNuxtModule } from '@nuxt/kit'

// registers locales the way a third-party module does, with its own `langDir`
export default defineNuxtModule({
  meta: { name: 'locale-provider' },
  setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.hook('i18n:registerModule', register => {
      register({
        langDir: resolve('./locales'),
        locales: [
          { code: 'fr', language: 'fr-FR', file: 'fr.json', name: 'Francais' },
          { code: 'nl', language: 'nl-NL', file: 'nl.json', name: 'Nederlands' }
        ]
      })
    })
  }
})

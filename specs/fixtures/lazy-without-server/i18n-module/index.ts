import { createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.hook('i18n:registerModule', register => {
      register({
        langDir: resolve('./locales'),
        locales: [
          {
            code: 'nl',
            language: 'nl-NL',
            file: 'lazy-locale-module-nl.ts',
            name: 'Nederlands'
          }
        ]
      })
    })
  }
})

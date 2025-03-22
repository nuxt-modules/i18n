import { createResolver, defineNuxtModule, installModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    await installModule('@nuxtjs/i18n', {
      langDir: resolve('./locales'),
      vueI18n: resolve('./i18n.config.ts'),
      locales: [
        {
          code: 'en',
          language: 'en',
          files: [resolve('./locales/en.json')],
          name: 'English'
        }
      ]
    })
  }
})

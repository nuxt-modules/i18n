import { createResolver, defineNuxtModule, installModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    installModule('../../../dist', {
      langDir: resolve('./locales'),
      vueI18n: resolve('./i18n.config.ts'),
      locales: [
        {
          code: 'en',
          iso: 'en',
          files: [resolve('./locales/en.json')],
          name: 'English'
        }
      ]
    })
  }
})

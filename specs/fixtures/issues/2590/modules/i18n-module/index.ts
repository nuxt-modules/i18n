import { createResolver, defineNuxtModule, installModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('i18n:registerModule', registerModule =>
      registerModule({
        langDir: resolve('lang'),
        locales: [
          {
            code: 'en',
            iso: 'en-US',
            file: 'en-US.ts',
            name: 'English'
          }
        ]
      })
    )

    await installModule('@nuxtjs/i18n', {
      lazy: true,
      defaultLocale: 'en',
      experimental: {
        jsTsFormatResource: true
      },
      detectBrowserLanguage: {
        useCookie: true,
        cookieKey: 'i18n_lang',
        redirectOn: 'root'
      },
      vueI18n: './i18n.config.ts'
    })
  }
})

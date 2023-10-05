// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['./layer-module', '@nuxtjs/i18n'],

  i18n: {
    vueI18n: './config/i18n.config.ts'
    // debug: true,
  }
})

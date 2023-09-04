// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['./layer-simple', './layer-simple-secondary'],
  modules: ['@nuxtjs/i18n']
})

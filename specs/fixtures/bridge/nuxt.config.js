import { defineNuxtConfig } from '@nuxt/bridge'

export default defineNuxtConfig({
  buildModules: ['@nuxtjs/i18n'],

  bridge: {
    vite: false
  },

  i18n: {}
})

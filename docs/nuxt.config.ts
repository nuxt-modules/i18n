import { defineNuxtConfig } from 'nuxt'
import overrideModule from './module'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  extends: ['@docus/docs-theme'],

  modules: ['@nuxthq/admin', '@docus/github', 'vue-plausible', overrideModule],

  // content: {
  //   sources: [
  //     {
  //       name: 'next',
  //       prefix: '/next',
  //       driver: 'fs',
  //       // base: resolve(__dirname, './content-next')
  //       base: fileURLToPath(new URL('./content-next', import.meta.url))
  //     }
  //   ]
  // },

  github: {
    owner: 'nuxt-community',
    repo: 'i18n-module',
    branch: 'next'
  },

  plausible: {
    domain: 'i18n.nuxtjs.org'
  }
})

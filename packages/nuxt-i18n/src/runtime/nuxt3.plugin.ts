import { createI18n, VERSION } from 'vue-i18n'
import { createRouter, localizeRoutes, VERSION as ROUTING_VERSION } from 'vue-i18n-routing'

import { defineNuxtPlugin } from '#app'
// @ts-ignore TODO:
export default defineNuxtPlugin(async nuxt => {
  const { vueApp: app, $router } = nuxt
  // @ts-ignore
  console.log('nuxt.plugin setup', nuxt, app.version, $router, VERSION, ROUTING_VERSION)

  const i18n = createI18n({
    locale: 'en',
    legacy: false,
    globalInjection: true,
    messages: {
      en: {
        hello: 'Hello world!'
      }
    }
  })

  app.use(i18n)
})

import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(async nuxtApp => {
  if ('pluginSetLocale' in nuxtApp._route.query && typeof nuxtApp._route.query.pluginSetLocale === 'string') {
    const app = useNuxtApp()
    await app.$i18n.setLocale(nuxtApp._route.query.pluginSetLocale)
  }
})

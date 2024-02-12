import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(async nuxtApp => {
  if ('pluginSetLocale' in nuxtApp._route.query) {
    const app = useNuxtApp()
    await app.$i18n.setLocale('fr')
  }
})

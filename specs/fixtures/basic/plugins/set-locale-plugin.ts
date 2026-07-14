import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(async nuxtApp => {
  if ('pluginSetLocale' in nuxtApp._route.query && typeof nuxtApp._route.query.pluginSetLocale === 'string') {
    const app = useNuxtApp()
    await app.$i18n.setLocale(nuxtApp._route.query.pluginSetLocale)
  }

  // server-only variant to test that a locale set during SSR is not reset during hydration (#3039)
  if (
    import.meta.server &&
    'serverSetLocale' in nuxtApp._route.query &&
    typeof nuxtApp._route.query.serverSetLocale === 'string'
  ) {
    const app = useNuxtApp()
    await app.$i18n.setLocale(nuxtApp._route.query.serverSetLocale)
  }
})

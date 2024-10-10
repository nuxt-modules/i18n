import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  async scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    // make sure the route has changed.
    if (nuxtApp.$18n && to.name !== from.name) {
      // `$i18n` is injected in the `setup` of the nuxtjs/i18n module.
      // `scrollBehavior` is guarded against being called even when it is not completed
      await nuxtApp.$i18n.waitForPendingLocaleChange()
    }
    return savedPosition || { top: 0 }
  }
}

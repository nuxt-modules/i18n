import { useNuxtApp } from '#app'

import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  async scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    if (nuxtApp.$18n && to.name !== from.name) {
      await nuxtApp.$i18n.waitForPendingLocaleChange()
    }
    return savedPosition || { top: 0 }
  }
}

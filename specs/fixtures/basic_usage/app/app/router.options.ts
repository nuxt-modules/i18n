import { useNuxtApp } from '#imports'

import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  async scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()

    if (nuxtApp.$config.public.i18n.skipSettingLocaleOnNavigate && nuxtApp.$18n && to.name !== from.name) {
      await nuxtApp.$i18n.waitForPendingLocaleChange()
    }

    return savedPosition || { top: 0 }
  }
}

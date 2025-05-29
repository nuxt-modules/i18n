import { useNuxtI18nContext } from '../context'
import { detectLocale, loadAndSetLocale, navigate } from '../utils'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: !__I18N_PRELOAD__ ? ['i18n:plugin'] : ['i18n:plugin', 'i18n:plugin:preload'],
  async setup() {
    const nuxt = useNuxtApp()
    const ctx = useNuxtI18nContext(nuxt)

    await nuxt.runWithContext(() => loadAndSetLocale(detectLocale(nuxt.$router.currentRoute.value)))

    // no pages or no prefixes - do not register route middleware
    if (!__I18N_ROUTING__) return

    addRouteMiddleware(
      'locale-changing',
      defineNuxtRouteMiddleware(async to => {
        const locale = await nuxt.runWithContext(() => loadAndSetLocale(detectLocale(to)))

        ctx.firstAccess = false

        return nuxt.runWithContext(() => navigate(to, locale))
      }),
      { global: true }
    )
  }
})

import { useNuxtI18nContext } from '../context'
import { detectLocale, detectRedirect, loadAndSetLocale, navigate } from '../utils'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: !__I18N_PRELOAD__ ? ['i18n:plugin'] : ['i18n:plugin', 'i18n:plugin:preload'],
  async setup() {
    const nuxt = useNuxtApp()
    const ctx = useNuxtI18nContext(nuxt)

    const detected = detectLocale(nuxt.$router.currentRoute.value)
    await nuxt.runWithContext(() => loadAndSetLocale(detected))

    // no pages or no prefixes - do not register route middleware
    if (!__I18N_ROUTING__) return

    addRouteMiddleware(
      'locale-changing',
      defineNuxtRouteMiddleware(async to => {
        const detected = detectLocale(to)
        const locale = await nuxt.runWithContext(() => loadAndSetLocale(detected))
        const redirectPath = await nuxt.runWithContext(() => detectRedirect(to, locale))

        ctx.firstAccess = false

        return nuxt.runWithContext(() => navigate(redirectPath, to.path, locale))
      }),
      { global: true }
    )
  }
})

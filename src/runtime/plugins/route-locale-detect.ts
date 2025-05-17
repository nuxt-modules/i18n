import { unref } from 'vue'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { detectLocale, detectRedirect, loadAndSetLocale, navigate } from '../utils'

import type { CompatRoute } from '../types'
import { useNuxtI18nContext } from '../context'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: !__I18N_PRELOAD__ ? ['i18n:plugin'] : ['i18n:plugin', 'i18n:plugin:preload'],
  async setup() {
    const logger = /*#__PURE__*/ createLogger('plugin:route-locale-detect')
    const nuxt = useNuxtApp()
    const ctx = useNuxtI18nContext(nuxt)

    async function handleRouteDetect(to: CompatRoute) {
      let detected = detectLocale(to, ctx.getLocaleFromRoute(to))

      if (ctx.firstAccess) {
        ctx.setLocale(detected)
        if (!ctx.preloaded) {
          await nuxt.runWithContext(() => ctx.loadLocaleMessages(detected))
        }
      }

      const modified = await nuxt.runWithContext(() => loadAndSetLocale(detected, ctx.firstAccess))
      if (modified) {
        detected = unref(nuxt.$i18n.locale)
      }

      return detected
    }

    await nuxt.runWithContext(() => handleRouteDetect(nuxt.$router.currentRoute.value))

    // app has no pages - do not register route middleware
    if (!__HAS_PAGES__) return

    addRouteMiddleware(
      'locale-changing',
      defineNuxtRouteMiddleware(async (to, from) => {
        __DEBUG__ && logger.log('locale-changing middleware', to, from)

        const locale = await nuxt.runWithContext(() => handleRouteDetect(to))

        const redirectPath = await nuxt.runWithContext(() =>
          detectRedirect({ to, from, locale, routeLocale: ctx.getLocaleFromRoute(to) }, true)
        )

        ctx.firstAccess = false

        __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

        return await nuxt.runWithContext(() => navigate({ nuxt, redirectPath, locale, route: to }))
      }),
      { global: true }
    )
  }
})

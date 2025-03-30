import { unref } from 'vue'
import { hasPages } from '#build/i18n.options.mjs'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, useNuxtApp } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { makeFallbackLocaleCodes } from '../messages'
import { detectLocale, detectRedirect, loadAndSetLocale, navigate } from '../utils'

import type { CompatRoute } from '../types'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: ['i18n:plugin'],
  async setup() {
    const logger = /*#__PURE__*/ createLogger('plugin:route-locale-detect')
    const nuxt = useNuxtApp()
    const currentRoute = nuxt.$router.currentRoute

    async function handleRouteDetect(to: CompatRoute) {
      let detected = detectLocale(
        to,
        nuxt._vueI18n.__localeFromRoute(to),
        unref(nuxt.$i18n.locale),
        nuxt.$i18n.getLocaleCookie()
      )

      if (nuxt._vueI18n.__firstAccess) {
        nuxt._vueI18n.__setLocale(detected)
        const fallbackLocales = makeFallbackLocaleCodes(unref(nuxt._vueI18n.global.fallbackLocale), [detected])
        await Promise.all(fallbackLocales.map(x => nuxt.$i18n.loadLocaleMessages(x)))
        await nuxt.$i18n.loadLocaleMessages(detected)
      }

      const modified = await nuxt.runWithContext(() => loadAndSetLocale(detected, nuxt._vueI18n.__firstAccess))
      if (modified) {
        detected = unref(nuxt.$i18n.locale)
      }

      return detected
    }

    await handleRouteDetect(currentRoute.value)

    // app has no pages - do not register route middleware
    if (!hasPages) {
      return
    }

    const localeChangeMiddleware = defineNuxtRouteMiddleware(async (to, from) => {
      __DEBUG__ && logger.log('locale-changing middleware', to, from)

      const locale = await nuxt.runWithContext(() => handleRouteDetect(to))

      const redirectPath = await nuxt.runWithContext(() =>
        detectRedirect({ to, from, locale, routeLocale: nuxt._vueI18n.__localeFromRoute(to) }, true)
      )

      nuxt._vueI18n.__firstAccess = false

      __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

      return await nuxt.runWithContext(() => navigate({ nuxt, redirectPath, locale, route: to }))
    })

    addRouteMiddleware('locale-changing', localeChangeMiddleware, { global: true })
  }
})

import { unref } from 'vue'
import { hasPages } from '#build/i18n.options.mjs'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { makeFallbackLocaleCodes } from '../messages'
import { detectLocale, detectRedirect, loadAndSetLocale, navigate } from '../utils'

import type { NuxtApp } from '#app'
import type { CompatRoute } from '../types'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: ['i18n:plugin'],
  async setup(nuxt) {
    const logger = /*#__PURE__*/ createLogger('plugin:route-locale-detect')
    const nuxtApp = nuxt as unknown as NuxtApp
    const currentRoute = nuxtApp.$router.currentRoute

    async function handleRouteDetect(to: CompatRoute) {
      let detected = detectLocale(
        to,
        nuxtApp._vueI18n.__localeFromRoute(to),
        unref(nuxtApp.$i18n.locale),
        nuxtApp.$i18n.getLocaleCookie()
      )

      if (nuxtApp._vueI18n.__firstAccess) {
        nuxtApp._vueI18n.__setLocale(detected)
        const fallbackLocales = makeFallbackLocaleCodes(unref(nuxtApp._vueI18n.global.fallbackLocale), [detected])
        await Promise.all(fallbackLocales.map(x => nuxtApp.$i18n.loadLocaleMessages(x)))
        await nuxtApp.$i18n.loadLocaleMessages(detected)
      }

      const modified = await nuxtApp.runWithContext(() => loadAndSetLocale(detected, nuxtApp._vueI18n.__firstAccess))
      if (modified) {
        detected = unref(nuxtApp.$i18n.locale)
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

      const locale = await nuxtApp.runWithContext(() => handleRouteDetect(to))

      const redirectPath = await nuxtApp.runWithContext(() =>
        detectRedirect({ to, from, locale, routeLocale: nuxtApp._vueI18n.__localeFromRoute(to) }, true)
      )

      nuxtApp._vueI18n.__firstAccess = false

      __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

      return await nuxtApp.runWithContext(() => navigate({ nuxtApp, redirectPath, locale, route: to }))
    })

    addRouteMiddleware('locale-changing', localeChangeMiddleware, { global: true })
  }
})

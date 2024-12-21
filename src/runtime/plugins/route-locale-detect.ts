import { unref } from 'vue'
import { hasPages, isSSG } from '#build/i18n.options.mjs'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware } from '#imports'
import { createLogger } from 'virtual:nuxt-i18n-logger'
import { createLocaleFromRouteGetter } from '../routing/utils'
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
    const getRouteLocale = createLocaleFromRouteGetter()

    async function handleRouteDetect(to: CompatRoute) {
      let detected = detectLocale(to, getRouteLocale(to), unref(nuxtApp.$i18n.locale), nuxtApp.$i18n.getLocaleCookie())

      if (nuxtApp._vueI18n.__firstAccess) {
        nuxtApp._vueI18n.__setLocale(detected)
        await nuxtApp.$i18n.loadLocaleMessages(detected)
      }

      const modified = await nuxtApp.runWithContext(() => loadAndSetLocale(detected, nuxtApp._vueI18n.__firstAccess))
      if (modified) {
        detected = unref(nuxtApp.$i18n.locale)
      }

      return detected
    }

    // router is enabled and project has pages
    if (!hasPages) {
      await handleRouteDetect(currentRoute.value)
      return
    }

    const localeChangeMiddleware = defineNuxtRouteMiddleware(async (to, from) => {
      if (isSSG && nuxtApp._vueI18n.__firstAccess) return
      __DEBUG__ && logger.log('locale-changing middleware', to, from)

      const locale = await nuxtApp.runWithContext(() => handleRouteDetect(to))

      const redirectPath = await nuxtApp.runWithContext(() =>
        detectRedirect({ to, from, locale, routeLocale: getRouteLocale(to) }, true)
      )

      nuxtApp._vueI18n.__firstAccess = false

      __DEBUG__ && logger.log('redirectPath on locale-changing middleware', redirectPath)

      return await nuxtApp.runWithContext(() => navigate({ nuxtApp, redirectPath, locale, route: to }))
    })

    addRouteMiddleware('locale-changing', localeChangeMiddleware, { global: true })
  }
})

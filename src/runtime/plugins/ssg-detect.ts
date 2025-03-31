import { unref } from 'vue'
import { isSSG } from '#build/i18n.options.mjs'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { detectBrowserLanguage, runtimeDetectBrowserLanguage } from '../internal'

export default defineNuxtPlugin({
  name: 'i18n:plugin:ssg-detect',
  dependsOn: ['i18n:plugin', 'i18n:plugin:route-locale-detect'],
  enforce: 'post',
  setup() {
    const nuxt = useNuxtApp()
    if (!isSSG || nuxt.$i18n.strategy !== 'no_prefix' || !runtimeDetectBrowserLanguage()) return

    const logger = /*#__PURE__*/ createLogger('plugin:i18n:ssg-detect')
    const localeCookie = nuxt.$i18n.getLocaleCookie()

    // NOTE: avoid hydration mismatch for SSG mode
    nuxt.hook('app:mounted', async () => {
      const detected = detectBrowserLanguage(
        nuxt.$router.currentRoute.value,
        localeCookie,
        localeCookie || unref(nuxt.$i18n.defaultLocale)
      )

      __DEBUG__ && logger.log('app:mounted: detectBrowserLanguage (locale, reason, error) -', Object.values(detected))

      await nuxt.$i18n.setLocale(detected.locale)
      nuxt._vueI18n.__firstAccess = false
    })
  }
})

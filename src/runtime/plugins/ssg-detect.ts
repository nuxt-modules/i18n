import { unref } from 'vue'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { detectBrowserLanguage } from '../internal'

export default defineNuxtPlugin({
  name: 'i18n:plugin:ssg-detect',
  dependsOn: ['i18n:plugin', 'i18n:plugin:route-locale-detect'],
  enforce: 'post',
  setup() {
    const nuxt = /*#__PURE__*/ useNuxtApp()
    if (!__IS_SSG__ || __I18N_STRATEGY__ !== 'no_prefix' || !nuxt.$config.public.i18n.detectBrowserLanguage) return

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

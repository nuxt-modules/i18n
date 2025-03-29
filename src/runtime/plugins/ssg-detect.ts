import { unref } from 'vue'
import { isSSG } from '#build/i18n.options.mjs'
import { defineNuxtPlugin } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { detectBrowserLanguage, runtimeDetectBrowserLanguage } from '../internal'
import type { NuxtApp } from '#app'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

export default defineNuxtPlugin({
  name: 'i18n:plugin:ssg-detect',
  dependsOn: ['i18n:plugin', 'i18n:plugin:route-locale-detect'],
  enforce: 'post',
  setup(nuxt) {
    if (
      !isSSG ||
      (nuxt as NuxtApp).$i18n.strategy !== 'no_prefix' ||
      !runtimeDetectBrowserLanguage(nuxt.$config.public.i18n as I18nPublicRuntimeConfig)
    )
      return

    const nuxtApp = nuxt as NuxtApp
    const logger = /*#__PURE__*/ createLogger('plugin:i18n:ssg-detect')
    const localeCookie = nuxtApp.$i18n.getLocaleCookie()

    // NOTE: avoid hydration mismatch for SSG mode
    nuxt.hook('app:mounted', async () => {
      const detected = detectBrowserLanguage(
        nuxtApp.$router.currentRoute.value,
        localeCookie,
        localeCookie || unref(nuxtApp.$i18n.defaultLocale)
      )

      __DEBUG__ && logger.log('app:mounted: detectBrowserLanguage (locale, reason, error) -', Object.values(detected))

      await nuxtApp.$i18n.setLocale(detected.locale)
      nuxtApp._vueI18n.__firstAccess = false
    })
  }
})

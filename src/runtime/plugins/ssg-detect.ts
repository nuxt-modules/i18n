import { defineNuxtPlugin } from '#imports'
import { unref } from 'vue'
import { createLogger } from 'virtual:nuxt-i18n-logger'
import { detectBrowserLanguage, getI18nCookie } from '../internal'
import type { NuxtApp } from '#app'
import { isSSG } from '#build/i18n.options.mjs'

export default defineNuxtPlugin({
  name: 'i18n:plugin:ssg-detect',
  enforce: 'post',
  setup(nuxt) {
    if (!isSSG || (nuxt as NuxtApp).$i18n.strategy !== 'no_prefix') return

    const nuxtApp = nuxt as NuxtApp
    const logger = /*#__PURE__*/ createLogger('plugin:i18n:ssg-detect')
    const localeCookie = getI18nCookie()
    // NOTE: avoid hydration mismatch for SSG mode
    const initialLocaleCookie = localeCookie.value
    nuxt.hook('app:mounted', async () => {
      __DEBUG__ && logger.log('hook app:mounted')
      const detected = detectBrowserLanguage(
        nuxtApp.$router.currentRoute.value,
        { ssg: 'ssg_setup', firstAccess: true, localeCookie: initialLocaleCookie },
        initialLocaleCookie || unref(nuxtApp.$i18n.defaultLocale)
      )
      __DEBUG__ && logger.log('app:mounted: detectBrowserLanguage (locale, reason, from) -', Object.values(detected))
      await nuxtApp.$i18n.setLocale(detected.locale)
    })
  }
})

import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { createLogger } from '#nuxt-i18n/logger'
import { useNuxtI18nContext } from '../context'
import { detectLocale } from '../utils'

export default defineNuxtPlugin({
  name: 'i18n:plugin:ssg-detect',
  dependsOn: !__I18N_PRELOAD__
    ? ['i18n:plugin', 'i18n:plugin:route-locale-detect']
    : ['i18n:plugin', 'i18n:plugin:route-locale-detect', 'i18n:plugin:preload'],
  enforce: 'post',
  setup() {
    const nuxt = /*#__PURE__*/ useNuxtApp()
    if (!__IS_SSG__ || __I18N_STRATEGY__ !== 'no_prefix' || !nuxt.$config.public.i18n.detectBrowserLanguage) return

    const logger = /*#__PURE__*/ createLogger('plugin:i18n:ssg-detect')
    const ctx = useNuxtI18nContext(nuxt)
    // NOTE: avoid hydration mismatch for SSG mode
    nuxt.hook('app:mounted', async () => {
      const detected = detectLocale(nuxt.$router.currentRoute.value, '')

      __DEBUG__ && logger.log('app:mounted: detectBrowserLanguage (locale) -', detected)

      await nuxt.$i18n.setLocale(detected)
      ctx.firstAccess = false
    })
  }
})

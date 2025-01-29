import { defineNuxtPlugin } from 'nuxt/app'
import { toValue } from 'vue'

export default defineNuxtPlugin({
  name: 'nuxt-issue-3330:i18n',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    if (!nuxtApp.ssrContext) return

    // @ts-expect-error lacking types
    nuxtApp.ssrContext.payload.serverDetectedLocale = toValue(nuxtApp.$i18n.locale)
  }
})

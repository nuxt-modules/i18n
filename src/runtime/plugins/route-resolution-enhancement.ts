import { defineNuxtPlugin } from '#imports'
import { applyRouteResolutionEnhancement } from '../routing/routing'
import { initCommonComposableOptions } from '../utils'
import type { NuxtApp } from '#app'

export default defineNuxtPlugin({
  name: 'i18n:route-resolution-enhancement',
  dependsOn: ['i18n:plugin'],
  setup(nuxt) {
    if ((nuxt as unknown as NuxtApp).$config.public.i18n.experimental.routeResolutionEnhancement) {
      applyRouteResolutionEnhancement(initCommonComposableOptions())
    }
  }
})

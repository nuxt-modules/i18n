import { defineNuxtPlugin } from '#imports'
import type { Locale } from 'vue-i18n'
import { resolveRoute } from '../routing/routing'
import { useNuxtApp } from 'nuxt/app'
import { useRouter } from 'vue-router'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

type ResolverParams = Parameters<import('#vue-router').Router['resolve']>

export default defineNuxtPlugin({
  name: 'i18n:route-resolution-enhancement',
  dependsOn: ['i18n:plugin'],
  setup() {
    const nuxt = useNuxtApp()
    const runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig

    if (!runtimeI18n.experimental.routeResolutionEnhancement) return

    const router = useRouter()
    const implicit = runtimeI18n.experimental.routeResolutionEnhancement === 'implicit'

    const originalResolve = router.resolve.bind(router)
    router.resolve = (
      to: ResolverParams[0],
      currentLocation: ResolverParams[1],
      options?: { locale?: Locale | boolean }
    ) => {
      /**
       * disable enhancement
       * - explicit mode without `locale`
       * - implicit mode with `locale: false`
       */
      if ((!implicit && options?.locale == null) || options?.locale === false) {
        return originalResolve(to, currentLocation)
      }

      // resolve to string | undefined
      const _locale = (typeof options?.locale === 'string' && options?.locale) || undefined
      console.log(_locale)
      return resolveRoute(nuxt._nuxtI18n, to, _locale ?? nuxt._nuxtI18n.getLocale())
    }
  }
})

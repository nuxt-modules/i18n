import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { resolveRoute } from '../routing/routing'
import { useRouter } from 'vue-router'
import { isString } from '@intlify/shared'

import type { Locale } from 'vue-i18n'
import type { I18nPublicRuntimeConfig } from '#internal-i18n-types'

type ResolveParams = Parameters<import('#vue-router').Router['resolve']>

export default defineNuxtPlugin({
  name: 'i18n:route-resolution-enhancement',
  dependsOn: ['i18n:plugin'],
  setup() {
    const nuxt = useNuxtApp()
    const runtimeI18n = nuxt.$config.public.i18n as I18nPublicRuntimeConfig
    if (!runtimeI18n.experimental.routeResolutionEnhancement) return

    const ctx = nuxt._nuxtI18n
    const router = useRouter()
    const implicit = runtimeI18n.experimental.routeResolutionEnhancement === 'implicit'

    /**
     * disable enhancement
     * - explicit mode without `locale`
     * - implicit mode with `locale: false`
     */
    const disableEnhancement = (locale?: Locale | boolean) => (!implicit && locale == null) || locale === false

    const originalResolve = router.resolve.bind(router)
    router.resolve = (
      to: ResolveParams[0],
      currentLocation: ResolveParams[1],
      { locale }: { locale?: Locale | boolean } = {}
    ) => {
      if (disableEnhancement(locale)) {
        return originalResolve(to, currentLocation)
      }

      // if `locale` is `false` or `undefined`, use the current locale
      return resolveRoute(ctx, to, isString(locale) ? locale : ctx.getLocale())
    }
  }
})

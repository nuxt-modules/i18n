import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { resolveRoute } from '../routing/routing'
import { useRouter } from 'vue-router'
import { isString } from '@intlify/shared'

import type { Locale } from 'vue-i18n'

type ResolveParams = Parameters<import('#vue-router').Router['resolve']>

export default defineNuxtPlugin({
  name: 'i18n:route-resolution-enhancement',
  dependsOn: ['i18n:plugin'],
  setup() {
    const nuxt = /*#__PURE__*/ useNuxtApp()
    if (!__I18N_ROUTE_RESOLUTION__) return

    const ctx = nuxt._nuxtI18n
    const router = useRouter()

    /**
     * disable enhancement
     * - explicit mode without `locale`
     * - implicit mode with `locale: false`
     */
    const disableEnhancement = (locale?: Locale | boolean) =>
      (__I18N_ROUTE_RESOLUTION__ !== 'implicit' && locale == null) || locale === false

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

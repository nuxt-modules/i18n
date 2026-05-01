import { useNuxtI18nContext, useResolvedLocale } from '../context'
import { detectLocale, detectLocaleFromRouteOrDomain, loadAndSetLocale, navigate } from '../utils'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, useNuxtApp, useRouter } from '#imports'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: !__I18N_PRELOAD__ ? ['i18n:plugin'] : ['i18n:plugin', 'i18n:plugin:preload'],
  async setup(_nuxt) {
    // @ts-expect-error untyped internal id parameter
    const nuxt = useNuxtApp(_nuxt._id)
    const ctx = useNuxtI18nContext(nuxt)

    // Set meta.key on compact routes so NuxtPage triggers transitions when the locale param changes.
    // This must be done at runtime because functions in route meta don't survive Nuxt's build-time serialization.
    if (__I18N_COMPACT_ROUTES__) {
      const router = useRouter()
      for (const route of router.getRoutes()) {
        if (route.meta?.__i18nCompact && route.meta.key == null) {
          route.meta.key = (r: { path: string }) => r.path
        }
      }
    }

    const resolvedLocale = useResolvedLocale()
    const isInitialSsgHydration = __IS_SSG__ && import.meta.client && ctx.initial && __I18N_STRATEGY__ !== 'no_prefix'
    const initialLocale = isInitialSsgHydration
      // Keep the prerendered locale stable through hydration and defer browser detection to the SSG plugin.
      ? detectLocaleFromRouteOrDomain(nuxt, nuxt.$router.currentRoute.value)
      : (resolvedLocale.value || detectLocale(nuxt, nuxt.$router.currentRoute.value))
    await nuxt.runWithContext(() =>
      loadAndSetLocale(
        nuxt,
        initialLocale,
        { syncCookie: !isInitialSsgHydration },
      ),
    )

    // no pages or no prefixes - do not register route middleware
    if (!__I18N_ROUTING__ || (import.meta.server && __I18N_SERVER_REDIRECT__)) { return }

    addRouteMiddleware(
      'locale-changing',
      defineNuxtRouteMiddleware(async (to) => {
        if (__IS_SSG__ && import.meta.client && ctx.initial) {
          return
        }

        const locale = await nuxt.runWithContext(() => loadAndSetLocale(nuxt, detectLocale(nuxt, to)))

        ctx.initial = false

        return nuxt.runWithContext(() => navigate(nuxt, to, locale))
      }),
      { global: true },
    )
  },
})

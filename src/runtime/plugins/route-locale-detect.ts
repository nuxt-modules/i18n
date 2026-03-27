import { useNuxtI18nContext, useResolvedLocale } from '../context'
import { detectLocale, loadAndSetLocale, navigate } from '../utils'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, useNuxtApp, useRouter } from '#imports'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: !__I18N_PRELOAD__ ? ['i18n:plugin'] : ['i18n:plugin', 'i18n:plugin:preload'],
  async setup(_nuxt) {
    // @ts-expect-error untyped internal id parameter
    const nuxt = useNuxtApp(_nuxt._id)
    const ctx = useNuxtI18nContext(nuxt)

    // Set meta.key on consolidated routes so NuxtPage triggers transitions when the locale param changes.
    // This must be done at runtime because functions in route meta don't survive Nuxt's build-time serialization.
    if (__I18N_CONSOLIDATED_ROUTES__) {
      const router = useRouter()
      for (const route of router.getRoutes()) {
        if (route.meta?.__i18nConsolidated) {
          route.meta.key = (r: { path: string }) => r.path
        }
      }
    }

    const resolvedLocale = useResolvedLocale()
    await nuxt.runWithContext(() =>
      loadAndSetLocale(
        nuxt,
        (ctx.initial && resolvedLocale.value) || detectLocale(nuxt, nuxt.$router.currentRoute.value),
      ),
    )

    // no pages or no prefixes - do not register route middleware
    if (!__I18N_ROUTING__ || (import.meta.server && __I18N_SERVER_REDIRECT__)) { return }

    addRouteMiddleware(
      'locale-changing',
      defineNuxtRouteMiddleware(async (to) => {
        const locale = await nuxt.runWithContext(() => loadAndSetLocale(nuxt, detectLocale(nuxt, to)))

        ctx.initial = false

        return nuxt.runWithContext(() => navigate(nuxt, to, locale))
      }),
      { global: true },
    )
  },
})

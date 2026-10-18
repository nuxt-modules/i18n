import { useNuxtI18nContext, useResolvedLocale } from '../context'
import { detectLocale, loadAndSetLocale, navigate } from '../utils'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#imports'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: !__I18N_PRELOAD__ ? ['i18n:plugin'] : ['i18n:plugin', 'i18n:plugin:preload'],
  async setup(_nuxt) {
    // @ts-expect-error untyped internal id parameter
    const nuxt = useNuxtApp(_nuxt._id)
    const ctx = useNuxtI18nContext(nuxt)

    // skips rendering a page the server has already redirected
    const serverRedirect = import.meta.server && __I18N_SERVER_REDIRECT__
      ? nuxt.ssrContext?.event.context.nuxtI18n?.redirect
      : undefined
    if (serverRedirect) {
      await nuxt.runWithContext(() =>
        navigateTo(serverRedirect.location, { external: true, redirectCode: serverRedirect.status }),
      )
      return
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

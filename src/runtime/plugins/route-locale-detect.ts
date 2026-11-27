import { useNuxtI18nContext, useResolvedLocale } from '../context'
import { detectLocale, loadAndSetLocale, navigate } from '../utils'
import { resolveLocaleReach } from '../shared/domain'
import { getLocaleFromRouteName } from '#i18n-kit/routing'
import { addRouteMiddleware, createError, defineNuxtPlugin, defineNuxtRouteMiddleware, navigateTo, useRequestURL } from '#imports'

export default defineNuxtPlugin({
  name: 'i18n:plugin:route-locale-detect',
  dependsOn: ['i18n:plugin', 'i18n:plugin:preload'],
  async setup(nuxt) {
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

    // without a prefix every domain matches the route paths of all locales (#3226)
    if (__I18N_DOMAINS__ && __I18N_STRATEGY__ === 'no_prefix') {
      addRouteMiddleware(
        'i18n-host-routes',
        defineNuxtRouteMiddleware((to) => {
          const host = useRequestURL({ xForwardedHost: true }).host
          const locale = getLocaleFromRouteName(String(to.name))
          // the routes of the host's default locale are ordered first and match the paths it shares
          if (locale === ctx.getDefaultLocale() || resolveLocaleReach(ctx.getLocales(), host, locale) !== 'other-domain') { return }
          return createError({
            statusCode: 404,
            statusMessage: `Page not found: ${to.fullPath}`,
            data: { path: to.fullPath },
            fatal: true,
          })
        }),
        { global: true },
      )
    }

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

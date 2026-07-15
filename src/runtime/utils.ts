import { navigateTo, useNuxtApp, useRequestEvent } from '#imports'
import { localePath, switchLocalePath } from './routing/routing'
import { createNavigationResolver } from './routing/navigation'
import { useNuxtI18nContext } from './context'
import { useComposableContext } from './composable-context'
import { isSupportedLocale } from './shared/locales'
import { createLocaleDetector, useDetectors } from './shared/detection'
import { useI18nDetection } from './shared/utils'

import type { Locale } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { CompatRoute } from './types'

export async function loadAndSetLocale(nuxtApp: NuxtApp, locale: Locale): Promise<string> {
  const ctx = useNuxtI18nContext(nuxtApp)
  const oldLocale = ctx.getLocale()

  // skip if locale is already set and there is no pending locale change to a different locale
  if (locale === oldLocale && !ctx.initial && (!ctx.vueI18n.__pendingLocale || ctx.vueI18n.__pendingLocale === locale)) {
    return locale
  }

  const data = { oldLocale, newLocale: locale, initialSetup: ctx.initial, context: nuxtApp }
  let override = (await nuxtApp.callHook('i18n:beforeLocaleSwitch', data)) as string | undefined
  if (override != null && import.meta.dev) {
    console.warn('[nuxt-i18n] Do not return in `i18n:beforeLocaleSwitch`, mutate `data.newLocale` instead.')
  }
  override ??= data.newLocale

  if (isSupportedLocale(override)) {
    locale = override
  }

  await ctx.loadMessages(locale)
  await ctx.setLocaleSuspend(locale)

  return locale
}

export function detectLocale(nuxtApp: NuxtApp, route: string | CompatRoute): string {
  const detectConfig = useI18nDetection(nuxtApp)
  const detectors = useDetectors(useRequestEvent(nuxtApp), detectConfig, nuxtApp)
  const ctx = useNuxtI18nContext(nuxtApp)
  const detect = createLocaleDetector({
    detection: detectConfig,
    routing: __I18N_ROUTING__,
    domains: __I18N_DOMAINS__,
  })

  return detect(detectors, route, ctx.initial) || ctx.getLocale() || ctx.getDefaultLocale() || ''
}

export function navigate(nuxtApp: NuxtApp, to: CompatRoute, locale: string) {
  if (!__I18N_ROUTING__ || __DIFFERENT_DOMAINS__) { return }

  const ctx = useNuxtI18nContext(nuxtApp)
  const _ctx = useComposableContext(nuxtApp)
  const detectors = useDetectors(useRequestEvent(), useI18nDetection(nuxtApp), nuxtApp)
  const resolve = createNavigationResolver({
    rootRedirect: ctx.rootRedirect,
    redirectStatusCode: ctx.redirectStatusCode,
    localePath: (path, locale) => localePath(_ctx, path, locale),
    switchLocalePath: (locale, route) => switchLocalePath(_ctx, locale, route),
    routeLocale: route => detectors.route(route),
    hasRoute: name => _ctx.router.hasRoute(name),
    getLocaleCodes: () => _ctx.getLocales().map(locale => locale.code),
    strategy: __I18N_STRATEGY__,
    compactRoutes: __I18N_COMPACT_ROUTES__,
  })

  const resolved = resolve(to, locale, !!ctx.vueI18n.__pendingLocale && !!useNuxtApp()._processingMiddleware)
  if (resolved) {
    return navigateTo(resolved.path, { redirectCode: resolved.code })
  }
}

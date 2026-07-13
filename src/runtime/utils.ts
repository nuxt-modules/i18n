import { isEqual } from 'ufo'
import { isString } from '@intlify/shared'
import { navigateTo, useNuxtApp, useRequestEvent } from '#imports'
import { getLocalizedRouteName, getRouteBaseName } from '#i18n-kit/routing'
import { localePath, switchLocalePath } from './routing/routing'
import { useNuxtI18nContext } from './context'
import { useComposableContext } from './composable-context'
import { isSupportedLocale } from './shared/locales'
import { useDetectors } from './shared/detection'
import { useI18nDetection } from './shared/utils'

import type { Locale } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { DetectBrowserLanguageOptions } from '#internal-i18n-types'
import type { ComposableContext } from './composable-context'
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

function skipDetect(detect: DetectBrowserLanguageOptions, path: string, pathLocale: string | undefined): boolean {
  // no routes - force detection
  if (!__I18N_ROUTING__) {
    return false
  }

  // detection only on root
  if (detect.redirectOn === 'root' && path !== '/') {
    return true
  }

  // detection only on unprefixed route
  if (detect.redirectOn === 'no prefix' && !detect.alwaysRedirect && isSupportedLocale(pathLocale)) {
    return true
  }

  return false
}

export function detectLocale(nuxtApp: NuxtApp, route: string | CompatRoute): string {
  const detectConfig = useI18nDetection(nuxtApp)
  const detectors = useDetectors(useRequestEvent(nuxtApp), detectConfig, nuxtApp)
  const ctx = useNuxtI18nContext(nuxtApp)
  const path = isString(route) ? route : route.path

  function* detect() {
    if (ctx.initial && detectConfig.enabled && !skipDetect(detectConfig, path, detectors.route(path))) {
      yield detectors.cookie()
      yield detectors.header()
      yield detectors.navigator()
      yield detectConfig.fallbackLocale
    }

    if (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__) {
      yield detectors.host(path)
    }

    if (__I18N_ROUTING__) {
      yield detectors.route(route)
    }
  }

  for (const detected of detect()) {
    if (detected && isSupportedLocale(detected)) {
      return detected
    }
  }

  return ctx.getLocale() || ctx.getDefaultLocale() || ''
}

/**
 * Routes with localization disabled (e.g. `definePageMeta({ i18n: false })`) keep their
 * unsuffixed record name and have no localized variants, unlike compact routes and
 * unprefixed fallback routes (e.g. the root route kept for `strategy: 'prefix'`).
 */
function isUnlocalizedRoute(ctx: ComposableContext, to: CompatRoute): boolean {
  if (__I18N_STRATEGY__ === 'no_prefix' || to.name == null) { return false }
  const name = String(to.name)
  if (getRouteBaseName(name) !== name) { return false }
  if (__I18N_COMPACT_ROUTES__ && to.matched.some(r => r.meta.__i18nCompact)) { return false }
  return !ctx.getLocales().some(locale => ctx.router.hasRoute(getLocalizedRouteName(name, locale.code, false)))
}

export function navigate(nuxtApp: NuxtApp, to: CompatRoute, locale: string) {
  if (!__I18N_ROUTING__ || __DIFFERENT_DOMAINS__) { return }

  const ctx = useNuxtI18nContext(nuxtApp)
  const _ctx = useComposableContext(nuxtApp)

  if (to.path === '/' && ctx.rootRedirect) {
    return navigateTo(localePath(_ctx, ctx.rootRedirect.path, locale), { redirectCode: ctx.rootRedirect.code })
  }

  // skip - localization disabled for route (#3987)
  if (isUnlocalizedRoute(_ctx, to)) { return }

  // skip - pending locale inside navigation middleware
  if (ctx.vueI18n.__pendingLocale && useNuxtApp()._processingMiddleware) {
    return
  }

  // skip - redirection optional prevents prefix removal, reconsider if needed (#2288)
  const detectors = useDetectors(useRequestEvent(), useI18nDetection(nuxtApp), nuxtApp)
  if (detectors.route(to) === locale) {
    return
  }

  // skip redirect if resolved route matches current route (#1889, #2226)
  const destination = switchLocalePath(_ctx, locale, to) || localePath(_ctx, to.fullPath, locale)
  if (isEqual(destination, to.fullPath)) {
    return
  }

  return navigateTo(destination, { redirectCode: ctx.redirectStatusCode })
}

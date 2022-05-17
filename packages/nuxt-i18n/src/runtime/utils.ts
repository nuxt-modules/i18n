import { isVue2 } from 'vue-demi'
import {
  getLocale,
  setLocale,
  isI18nInstance,
  isComposer,
  isExportedGlobalComposer,
  isVueI18n,
  createLocaleFromRouteGetter
} from 'vue-i18n-routing'
import { isString } from '@intlify/shared'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault } from '#build/i18n.options.mjs'
import { detectBrowserLanguage, getLocaleCookie } from '#build/i18n.internal.mjs'

import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-i18n-routing'
import type { I18n, VueI18n, I18nOptions, Locale } from '@intlify/vue-i18n-bridge'
import type { NuxtI18nOptions } from '#build/i18n.options.mjs'
import type { DeepRequired } from 'ts-essentials'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isLegacyVueI18n(target: any): target is VueI18n {
  return target != null && ('__VUE_I18N_BRIDGE__' in target || '_sync' in target)
}

export function setCookieLocale(i18n: I18n, locale: Locale) {
  console.log('setCookieLocale', locale)
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  return isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.setLocaleCookie(locale)
      : target.setLocaleCookie(locale)
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (target as any).setLocaleCookie(locale)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (target as any).setLocaleCookie(locale)
}

export function loadAndSetLocale(
  newLocale: string,
  i18n: I18n,
  useCookie: boolean = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie
): void {
  if (!newLocale) {
    return
  }

  const oldLocale = getLocale(i18n)
  // TODO: remove console log!
  console.log('loadAndSetLocale: oldLocale', oldLocale)
  console.log('loadAndSetLocale: newLoacal', newLocale)
  if (oldLocale === newLocale) {
    return
  }

  // set the locale
  if (useCookie) {
    setCookieLocale(i18n, newLocale)
  }
  setLocale(i18n, newLocale)
}

export function detectLocale(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  i18n: I18n,
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>,
  localeCodes: string[] = []
) {
  const { strategy, defaultLocale, vueI18n } = nuxtI18nOptions
  const initialLocale = getLocale(i18n) || defaultLocale || (vueI18n as I18nOptions).locale || 'en-US'
  const browserLocale = nuxtI18nOptions.detectBrowserLanguage
    ? detectBrowserLanguage(route, context, nuxtI18nOptions, nuxtI18nInternalOptions, localeCodes, initialLocale)
    : ''
  // TODO: remove console log!
  console.log('detectLocale strategy:', strategy)
  console.log('detectLocale browserLocale:', browserLocale)
  console.log('detectLocale initialLocale:', initialLocale)

  let finalLocale: string | undefined = browserLocale
  if (!finalLocale) {
    if (strategy !== 'no_prefix') {
      finalLocale = routeLocaleGetter(route)
      // TODO: remove console log!
      console.log('detectLocale routeLocale:', finalLocale)
    }
  }

  if (!finalLocale && nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie) {
    finalLocale = getLocaleCookie(context, { ...nuxtI18nOptions, localeCodes })
    // TODO: remove console log!
    console.log('detectLocale cookieLocale:', finalLocale)
  }

  if (!finalLocale) {
    finalLocale = defaultLocale || ''
  }

  return finalLocale
}

export function detectRedirect(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: any, // TODO: should resolve type!
  targetLocale: Locale,
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>
): string {
  const { strategy, defaultLocale } = nuxtI18nOptions
  // TODO: remove console log!
  console.log('detectRedirect route:', route)
  console.log('detectRedirect strategy:', strategy)
  console.log('detectRedirect targetLocale:', targetLocale)
  console.log('detectRedirect defaultLocale:', defaultLocale)

  let redirectPath = ''
  // decide whether we should redirect to a different route.
  if (
    !process.static &&
    // !app.i18n.differentDomains &&
    strategy !== 'no_prefix' &&
    // skip if already on the new locale unless the strategy is "prefix_and_default" and this is the default
    // locale, in which case we might still redirect as we prefer unprefixed route in this case.
    (routeLocaleGetter(route) !== targetLocale || (strategy === 'prefix_and_default' && targetLocale === defaultLocale))
  ) {
    // the current route could be 404 in which case attempt to find matching route using the full path since
    // "switchLocalePath" can only find routes if the current route exists.
    const fullPath = isString(route) ? route : route.fullPath
    const routePath = app.switchLocalePath(targetLocale) || app.localePath(fullPath, targetLocale)
    // TODO: remove console log!
    console.log('detectRedirect: fullpath -> ', fullPath, ', routePath -> ', routePath)
    if (isString(routePath) && routePath !== fullPath && !routePath.startsWith('//')) {
      redirectPath = routePath
    }
  }

  // TODO: remove console log!
  console.log('detectRedirect: redirectPath -> ', redirectPath)
  return redirectPath
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export function proxyNuxt(context: any, target: Function) {
  return function () {
    const app = isVue2 ? context.app : context.vueApp
    return Reflect.apply(
      target,
      {
        getRouteBaseName: app.getRouteBaseName,
        i18n: app.i18n,
        localePath: app.localePath,
        localeLocation: app.localeLocation,
        localeRoute: app.localeRoute,
        localeHead: app.localeHead,
        req: process.server && isVue2 ? context.req : null,
        route: isVue2 ? context.route : context.$router.currentRoute.value,
        router: isVue2 ? app.router : context.$router,
        store: isVue2 ? context.store : undefined
      },
      // eslint-disable-next-line prefer-rest-params
      arguments
    )
  }
}

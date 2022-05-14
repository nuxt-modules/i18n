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
import { nuxtI18nInternalOptions } from '#build/i18n.options.mjs'
import { detectBrowserLanguage } from '#build/i18n.internal.mjs'

import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-i18n-routing'
import type { I18n, Composer, VueI18n, I18nOptions } from '@intlify/vue-i18n-bridge'
import type { NuxtI18nOptions } from '#build/i18n.options.mjs'
import type { DeepRequired } from 'ts-essentials'

// TODO: that should be removed!
export function isLegacyVueI18n(target: any): target is VueI18n {
  return target != null && ('__VUE_I18N_BRIDGE__' in target || '_sync' in target)
}

// TODO: that should be removed!
export function getBrowserLocale(i18n: I18n | Composer) {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  const locale = isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.getBrowserLocale()
      : target.getBrowserLocale()
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? (target as any).getBrowserLocale()
      : (target as any).getBrowserLocale() // TODO
  // TODO: remove console log!
  console.log('getBrowserLocale', locale)
  return locale
}

// TODO: that should be removed!
export function getCookieLocale(i18n: I18n | Composer) {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  const locale = isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.getLocaleCookie()
      : target.getLocaleCookie()
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? (target as any).getLocaleCookie()
      : (target as any).getLocaleCookie() // TODO
  // TODO: remove console log!
  console.log('getCookieLocale', locale)
  return locale
}

// TODO: that should be removed!
export function setCookieLocale(i18n: I18n | Composer, locale: string) {
  // TODO: remove console log!
  console.log('setCookieLocale', locale)
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  return isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.setLocaleCookie(locale)
      : target.setLocaleCookie(locale)
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? (target as any).setLocaleCookie(locale)
      : (target as any).setLocaleCookie(locale)
}

export async function loadAndSetLocale(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  newLocale: string,
  app: any, // TODO: should resolve type!
  i18n: I18n,
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>
): Promise<string> {
  const { strategy, defaultLocale } = nuxtI18nOptions
  if (!newLocale) {
    return ''
  }

  const oldLocale = getLocale(i18n)
  // TODO: remove console log!
  console.log('loadAndSetLocale: oldLocale', oldLocale)
  console.log('loadAndSetLocale: newLoacal', newLocale)
  if (oldLocale === newLocale) {
    return ''
  }

  // set the locale
  if (nuxtI18nOptions.detectBrowserLanguage.useCookie) {
    setCookieLocale(i18n, newLocale)
  }
  setLocale(i18n, newLocale)

  // decide whether we should redirect to a different route.
  let redirectPath = ''
  const isStaticGenerate = process.static && process.server
  if (
    !isStaticGenerate &&
    // !app.i18n.differentDomains &&
    strategy !== 'no_prefix' &&
    // skip if already on the new locale unless the strategy is "prefix_and_default" and this is the default
    // locale, in which case we might still redirect as we prefer unprefixed route in this case.
    (routeLocaleGetter(route) !== newLocale || (strategy === 'prefix_and_default' && newLocale === defaultLocale))
  ) {
    // the current route could be 404 in which case attempt to find matching route using the full path since
    // "switchLocalePath" can only find routes if the current route exists.
    const fullPath = isString(route) ? route : route.fullPath
    // TODO: remove console log!
    console.log('loadAndSetLocale: fullPath -> ', fullPath)
    const routePath = app.switchLocalePath(newLocale) || app.localePath(fullPath, newLocale)
    if (isString(routePath) && routePath !== fullPath && !routePath.startsWith('//')) {
      redirectPath = routePath
    }
  }

  // TODO: remove console log!
  console.log('loadAndSetLocale: redirectPath -> ', redirectPath)
  return redirectPath
}

export function detectLocale(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  i18n: I18n,
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>,
  localeCodes: string[] = []
) {
  const {
    strategy,
    defaultLocale,
    vueI18n,
    detectBrowserLanguage: { useCookie }
  } = nuxtI18nOptions
  const initialLocale = getLocale(i18n) || defaultLocale || (vueI18n as I18nOptions).locale || 'en-US'
  const routeLocale = strategy !== 'no_prefix' ? routeLocaleGetter(route) : ''
  const browserLocale = nuxtI18nOptions.detectBrowserLanguage
    ? detectBrowserLanguage(route, context, nuxtI18nOptions, nuxtI18nInternalOptions, localeCodes, initialLocale)
    : ''
  // TODO: remove console log!
  console.log('detectLocale strategy:', strategy)
  console.log('detectLocale routeLocale:', routeLocale)
  console.log('detectLocale browserLocale:', browserLocale)
  console.log('detectLocale initialLocale:', initialLocale)

  if (strategy === 'no_prefix') {
    return browserLocale
  } else if (strategy === 'prefix_and_default') {
    return useCookie ? browserLocale : routeLocale
  } else {
    return routeLocale
  }
}

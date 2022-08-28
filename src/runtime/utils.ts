/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getLocale,
  setLocale,
  getLocaleCodes,
  createLocaleFromRouteGetter,
  getRouteBaseName,
  localePath,
  localeRoute,
  switchLocalePath,
  localeHead
} from 'vue-i18n-routing'
import { navigateTo, NuxtApp } from '#app'
import { isString, isArray, isObject } from '@intlify/shared'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault } from '#build/i18n.options.mjs'
import {
  detectBrowserLanguage,
  getLocaleCookie,
  callVueI18nInterfaces,
  getVueI18nPropertyValue,
  loadLocale,
  defineGetter,
  proxyNuxt
} from '#build/i18n.internal.mjs'

import type { Route, RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-i18n-routing'
import type {
  I18n,
  I18nOptions,
  Locale,
  FallbackLocale,
  LocaleMessages,
  DefineLocaleMessage
} from '@intlify/vue-i18n-bridge'
import type { NuxtI18nOptions, DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'
import type { DeepRequired } from 'ts-essentials'

export function setCookieLocale(i18n: I18n, locale: Locale) {
  return callVueI18nInterfaces(i18n, 'setLocaleCookie', locale)
}

export function setLocaleMessage(i18n: I18n, locale: Locale, messages: Record<string, any>) {
  return callVueI18nInterfaces(i18n, 'setLocaleMessage', locale, messages)
}

function onBeforeLanguageSwitch(
  i18n: I18n,
  oldLocale: string,
  newLocale: string,
  initial: boolean,
  context: NuxtApp
): string | void {
  return callVueI18nInterfaces(i18n, 'onBeforeLanguageSwitch', oldLocale, newLocale, initial, context)
}

export function onLanguageSwitched(i18n: I18n, oldLocale: string, newLocale: string): void {
  return callVueI18nInterfaces(i18n, 'onLanguageSwitched', oldLocale, newLocale)
}

function makeFallbackLocaleCodes(fallback: FallbackLocale, locales: Locale[]): Locale[] {
  let fallbackLocales: string[] = []
  if (isArray(fallback)) {
    fallbackLocales = fallback
  } else if (isObject(fallback)) {
    const targets = [...locales, 'default']
    for (const locale of targets) {
      if (fallback[locale]) {
        fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)]
      }
    }
  } else if (isString(fallback) && locales.every(locale => locale !== fallback)) {
    fallbackLocales.push(fallback)
  }
  return fallbackLocales
}

export async function loadInitialMessages(
  context: NuxtApp,
  messages: LocaleMessages<DefineLocaleMessage>,
  options: DeepRequired<NuxtI18nOptions> & {
    initialLocale: Locale
    fallbackLocale: FallbackLocale
    localeCodes: string[]
  }
): Promise<Record<string, any>> {
  const { defaultLocale, initialLocale, localeCodes, fallbackLocale, langDir, lazy } = options
  const setter = (locale: Locale, message: Record<string, any>) => (messages[locale] = message)

  if (langDir) {
    // load fallback messages
    if (lazy && fallbackLocale) {
      const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [defaultLocale, initialLocale])
      await Promise.all(fallbackLocales.map(locale => loadLocale(context, locale, setter)))
    }
    // load initial messages
    const locales = lazy ? [...new Set<Locale>().add(defaultLocale).add(initialLocale)] : localeCodes
    await Promise.all(locales.map(locale => loadLocale(context, locale, setter)))
  }

  return messages
}

export async function loadAndSetLocale(
  newLocale: string,
  context: NuxtApp,
  i18n: I18n,
  {
    useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    skipSettingLocaleOnNavigate = nuxtI18nOptionsDefault.skipSettingLocaleOnNavigate,
    initial = false,
    lazy = false,
    langDir = null
  }: Pick<DetectBrowserLanguageOptions, 'useCookie'> &
    Pick<NuxtI18nOptions, 'lazy' | 'langDir' | 'skipSettingLocaleOnNavigate'> & { initial?: boolean } = {}
): Promise<[boolean, string]> {
  let ret = false
  const oldLocale = getLocale(i18n)
  if (!newLocale) {
    return [ret, oldLocale]
  }

  if (oldLocale === newLocale) {
    return [ret, oldLocale]
  }

  // call onBeforeLanguageSwitch
  const localeOverride = onBeforeLanguageSwitch(i18n, oldLocale, newLocale, initial, context)
  const localeCodes = getLocaleCodes(i18n)
  if (localeOverride && localeCodes && localeCodes.includes(localeOverride)) {
    if (localeOverride === oldLocale) {
      return [ret, oldLocale]
    }
    newLocale = localeOverride
  }

  if (langDir) {
    const i18nFallbackLocales = getVueI18nPropertyValue<FallbackLocale>(i18n, 'fallbackLocale')
    if (lazy) {
      const setter = (locale: Locale, message: Record<string, any>) => setLocaleMessage(i18n, locale, message)
      if (i18nFallbackLocales) {
        const fallbackLocales = makeFallbackLocaleCodes(i18nFallbackLocales, [newLocale])
        await Promise.all(fallbackLocales.map(locale => loadLocale(context, locale, setter)))
      }
      await loadLocale(context, newLocale, setter)
    }
  }

  if (skipSettingLocaleOnNavigate) {
    return [ret, oldLocale]
  }

  // set the locale
  if (useCookie) {
    setCookieLocale(i18n, newLocale)
  }
  setLocale(i18n, newLocale)

  ret = true
  return [ret, oldLocale]
}

export function detectLocale(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  context: any,
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

  let finalLocale: string | undefined = browserLocale
  if (!finalLocale) {
    if (strategy !== 'no_prefix') {
      finalLocale = routeLocaleGetter(route)
    }
  }

  if (!finalLocale && nuxtI18nOptions.detectBrowserLanguage && nuxtI18nOptions.detectBrowserLanguage.useCookie) {
    finalLocale = getLocaleCookie(context, { ...nuxtI18nOptions, localeCodes })
  }

  if (!finalLocale) {
    finalLocale = defaultLocale || ''
  }

  return finalLocale
}

export function detectRedirect(
  route: string | Route | RouteLocationNormalized | RouteLocationNormalizedLoaded,
  nuxt: NuxtApp,
  targetLocale: Locale,
  routeLocaleGetter: ReturnType<typeof createLocaleFromRouteGetter>,
  nuxtI18nOptions: DeepRequired<NuxtI18nOptions>
): string {
  const { strategy, defaultLocale } = nuxtI18nOptions

  let redirectPath = ''
  // decide whether we should redirect to a different route.
  if (
    // !app.i18n.differentDomains &&
    strategy !== 'no_prefix' &&
    // skip if already on the new locale unless the strategy is "prefix_and_default" and this is the default
    // locale, in which case we might still redirect as we prefer unprefixed route in this case.
    (routeLocaleGetter(route) !== targetLocale || (strategy === 'prefix_and_default' && targetLocale === defaultLocale))
  ) {
    // the current route could be 404 in which case attempt to find matching route using the full path since
    // "switchLocalePath" can only find routes if the current route exists.
    const fullPath = isString(route) ? route : route.fullPath
    const routePath = nuxt.$switchLocalePath(targetLocale) || nuxt.$localePath(fullPath, targetLocale)
    if (isString(routePath) && routePath && routePath !== fullPath && !routePath.startsWith('//')) {
      redirectPath = routePath
    }
  }

  return redirectPath
}

export async function navigate(
  i18n: I18n,
  redirectPath: string,
  locale: string,
  {
    status = 302,
    skipSettingLocaleOnNavigate = nuxtI18nOptionsDefault.skipSettingLocaleOnNavigate
  }: { status?: number } & Pick<NuxtI18nOptions, 'skipSettingLocaleOnNavigate'> = {}
) {
  if (skipSettingLocaleOnNavigate) {
    i18n.__pendingLocale = locale
    i18n.__pendingLocalePromise = new Promise(resolve => {
      i18n.__resolvePendingLocalePromise = resolve
    })
    return
  }

  if (redirectPath) {
    return navigateTo(redirectPath, { redirectCode: status })
  }
}

export function inejctNuxtHelpers(nuxt: NuxtApp, i18n: I18n) {
  /**
   * NOTE:
   *  we will inject `i18n.global` to **nuxt app instance only**
   *  because vue-i18n has already injected into vue,
   *  it's not necessary to do, so we borrow from nuxt inject implementation.
   */
  defineGetter(nuxt as any, '$i18n', i18n.global)

  for (const pair of [
    ['getRouteBaseName', getRouteBaseName],
    ['localePath', localePath],
    ['localeRoute', localeRoute],
    ['switchLocalePath', switchLocalePath],
    ['localeHead', localeHead]
  ]) {
    defineGetter(nuxt as any, '$' + pair[0], proxyNuxt(nuxt, pair[1] as (...args: any) => any))
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

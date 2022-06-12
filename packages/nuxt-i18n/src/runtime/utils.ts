/* eslint-disable @typescript-eslint/no-explicit-any */

import { isVue2 } from 'vue-demi'
import { getLocale, setLocale, createLocaleFromRouteGetter } from 'vue-i18n-routing'
import { isString, isArray, isObject } from '@intlify/shared'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault } from '#build/i18n.options.mjs'
import { SERVER, STATIC } from '#build/i18n.frags.mjs'
import {
  detectBrowserLanguage,
  getLocaleCookie,
  callVueI18nInterfaces,
  getVueI18nPropertyValue,
  loadLocale
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
  // TODO: remove console log!
  console.log('setCookieLocale', locale)
  return callVueI18nInterfaces(i18n, 'setLocaleCookie', locale)
}

export function setLocaleMessage(i18n: I18n, locale: Locale, messages: Record<string, any>) {
  // TODO: remove console log!
  console.log('setLocaleMessage', locale, messages)
  return callVueI18nInterfaces(i18n, 'setLocaleMessage', locale, messages)
}

function onBeforeLanguageSwitch(
  i18n: I18n,
  oldLocale: string,
  newLocale: string,
  initial: boolean,
  context: any
): string | void {
  return callVueI18nInterfaces(i18n, 'onBeforeLanguageSwitch', oldLocale, newLocale, initial, context)
}

function onLanguageSwitched(i18n: I18n, oldLocale: string, newLocale: string): void {
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
  context: any,
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
  context: any,
  i18n: I18n,
  {
    useCookie = nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    initial = false,
    lazy = false,
    langDir = null
  }: Pick<DetectBrowserLanguageOptions, 'useCookie'> &
    Pick<NuxtI18nOptions, 'lazy' | 'langDir'> & { initial?: boolean } = {}
): Promise<boolean> {
  // TODO: remove console log!
  console.log('loadAndSetLocale: useCookie', useCookie)
  console.log('loadAndSetLocale: initial', initial)
  console.log('loadAndSetLocale: lazy', lazy)
  console.log('loadAndSetLocale: langDir', langDir)
  let ret = false
  if (!newLocale) {
    return ret
  }

  const oldLocale = getLocale(i18n)
  // TODO: remove console log!
  console.log('loadAndSetLocale: oldLocale', oldLocale)
  console.log('loadAndSetLocale: newLoacal', newLocale)
  if (oldLocale === newLocale) {
    return ret
  }

  // call onBeforeLanguageSwitch
  const localeOverride = onBeforeLanguageSwitch(i18n, oldLocale, newLocale, initial, context)
  if (localeOverride && (i18n as any).localeCodes && (i18n as any).localeCodes.includes(localeOverride)) {
    if (localeOverride === oldLocale) {
      return ret
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

  // set the locale
  if (useCookie) {
    setCookieLocale(i18n, newLocale)
  }
  setLocale(i18n, newLocale)

  // call onLanguageSwitched
  onLanguageSwitched(i18n, oldLocale, newLocale)

  ret = true
  return ret
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
    !STATIC &&
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

// eslint-disable-next-line @typescript-eslint/ban-types
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
        req: SERVER && isVue2 ? context.req : null,
        route: isVue2 ? context.route : context.$router.currentRoute.value,
        router: isVue2 ? app.router : context.$router,
        store: isVue2 ? context.store : undefined
      },
      // eslint-disable-next-line prefer-rest-params
      arguments
    )
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

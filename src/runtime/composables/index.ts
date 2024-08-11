import { useRequestHeaders, useCookie as useNuxtCookie } from '#imports'
import { ref, computed, watch, onUnmounted } from 'vue'
import { parseAcceptLanguage, wrapComposable, runtimeDetectBrowserLanguage } from '../internal'
import { localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { getActiveHead } from 'unhead'
import { getNormalizedLocales, initCommonComposableOptions } from '../utils'
import {
  getAlternateOgLocales,
  getCanonicalLink,
  getCurrentOgLocale,
  getHreflangLinks,
  getOgUrl,
  getRouteBaseName,
  localeHead,
  localeLocation,
  localePath,
  localeRoute,
  switchLocalePath
} from '../routing/compatibles'
import { findBrowserLocale } from '../routing/utils'
import { getLocale, getLocales, getComposer } from '../compatibility'

import type { Ref } from 'vue'
import type { Locale } from 'vue-i18n'
import type { RouteLocation, RouteLocationNormalizedLoaded, RouteLocationRaw, Router } from 'vue-router'
import type { I18nHeadMetaInfo, I18nHeadOptions, SeoAttributesOptions } from '#build/i18n.options.mjs'
import type { HeadParam } from '../utils'

export * from 'vue-i18n'
export * from './shared'

/**
 * Returns a function to set i18n params.
 *
 * @param options - An options object, see {@link SeoAttributesOptions}.
 *
 * @returns a {@link SetI18nParamsFunction}.
 *
 * @public
 */
export type SetI18nParamsFunction = (params: Partial<Record<Locale, unknown>>) => void
export function useSetI18nParams(seoAttributes?: SeoAttributesOptions): SetI18nParamsFunction {
  const common = initCommonComposableOptions()
  const head = getActiveHead()
  const i18n = getComposer(common.i18n)
  const router = common.router

  const locale = getLocale(common.i18n)
  const locales = getNormalizedLocales(getLocales(common.i18n))
  const _i18nParams = ref({})
  const experimentalSSR = common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR

  const i18nParams = computed({
    get() {
      return experimentalSSR ? common.metaState.value : router.currentRoute.value.meta.nuxtI18n ?? {}
    },
    set(val) {
      common.metaState.value = val
      _i18nParams.value = val
      router.currentRoute.value.meta.nuxtI18n = val
    }
  })

  const stop = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta.nuxtI18n = experimentalSSR ? common.metaState.value : _i18nParams.value
    }
  )

  onUnmounted(() => {
    stop()
  })

  const currentLocale = getNormalizedLocales(locales).find(l => l.code === locale) || { code: locale }
  const currentLocaleLanguage = currentLocale.language

  const setMeta = () => {
    const metaObject: HeadParam = {
      link: [],
      meta: []
    }

    // Adding SEO Meta
    if (locale && i18n.locales) {
      // Hard code to 'id', this is used to replace payload before ssr response
      const idAttribute = 'id'

      // prettier-ignore
      metaObject.link.push(
        ...getHreflangLinks(common, locales, idAttribute),
        ...getCanonicalLink(common, idAttribute, seoAttributes)
      )

      metaObject.meta.push(
        ...getOgUrl(common, idAttribute, seoAttributes),
        ...getCurrentOgLocale(currentLocale, currentLocaleLanguage, idAttribute),
        ...getAlternateOgLocales(locales, currentLocaleLanguage, idAttribute)
      )
    }

    head?.push(metaObject)
  }

  return function (params: Partial<Record<Locale, unknown>>) {
    i18nParams.value = { ...params }
    setMeta()
  }
}

/**
 * The `localeHead` function returns localized head properties for locale-related aspects.
 *
 * @remarks
 * The parameter signature of this function is the same as {@link localeHead}.
 *
 * @param options - An options object, see {@link I18nHeadOptions}
 *
 * @returns the route object for a given route, the route object is resolved by vue-router rather than just a full route path.
 *
 * @see {@link localeHead}
 *
 * @public
 */
export type LocaleHeadFunction = (options: I18nHeadOptions) => ReturnType<typeof localeHead>

/**
 * The `useLocaleHead` composable returns localized head properties for locale-related aspects.
 *
 * @param options - An options object, see {@link I18nHeadOptions}
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties} with Vue `ref`.
 *
 * @public
 */
export function useLocaleHead({
  addDirAttribute = false,
  addSeoAttributes = false,
  identifierAttribute = 'hid'
}: I18nHeadOptions = {}): Ref<I18nHeadMetaInfo> {
  const common = initCommonComposableOptions()
  const metaObject: Ref<I18nHeadMetaInfo> = ref({
    htmlAttrs: {},
    link: [],
    meta: []
  })

  function cleanMeta() {
    metaObject.value = {
      htmlAttrs: {},
      link: [],
      meta: []
    }
  }

  function updateMeta() {
    metaObject.value = localeHead(common, {
      addDirAttribute,
      addSeoAttributes,
      identifierAttribute
    })
  }

  if (import.meta.client) {
    const i18n = getComposer(common.i18n)
    const stop = watch(
      [() => common.router.currentRoute.value, i18n.locale],
      () => {
        cleanMeta()
        updateMeta()
      },
      { immediate: true }
    )
    onUnmounted(() => stop())
  } else {
    updateMeta()
  }

  return metaObject
}

/**
 * The function that resolves the route base name.
 *
 * @remarks
 * The parameter signatures of this function is the same as {@link getRouteBaseName}.
 *
 * @param givenRoute - A route location. The path or name of the route or an object for more complex routes.
 *
 * @returns The route base name, if route name is not defined, return `null`.
 *
 * @see {@link useRouteBaseName}
 *
 * @public
 */
export type RouteBaseNameFunction = (givenRoute?: RouteLocationNormalizedLoaded) => string | undefined

/**
 * The `useRouteBaseName` composable returns a function which returns the route base name.
 *
 * @remarks
 * The function returned by `useRouteBaseName` is the wrapper function with the same signature as {@link getRouteBaseName}.
 *
 * @returns A {@link RouteBaseNameFunction}.
 *
 * @public
 */
export function useRouteBaseName(): RouteBaseNameFunction {
  return wrapComposable(getRouteBaseName)
}

/**
 * The function that resolve locale path.
 *
 * @remarks
 * The parameter signature of this function is same as {@link localePath}.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns Returns the localized URL for a given route.
 *
 * @see {@link useLocalePath}
 *
 * @public
 */
export type LocalePathFunction = (route: RouteLocation | RouteLocationRaw, locale?: Locale) => string

/**
 * The `useLocalePath` composable returns function  that resolve the locale path.
 *
 * @remarks
 * The function returned by `useLocalePath` is the wrapper function with the same signature as {@link localePath}.
 *
 * @returns A {@link LocalePathFunction}.
 *
 * @public
 */
export function useLocalePath(): LocalePathFunction {
  return wrapComposable(localePath)
}

/**
 * The function that resolve route.
 *
 * @remarks
 * The parameter signature of this function is same as {@link localeRoute}.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optinal, if not specified, uses the current locale.
 *
 * @returns the route object for a given route, the route object is resolved by vue-router rather than just a full route path.
 *
 * @see {@link useLocaleRoute}
 *
 * @public
 */
export type LocaleRouteFunction = (
  route: RouteLocationRaw,
  locale?: Locale
) => ReturnType<Router['resolve']> | undefined

/**
 * The `useLocaleRoute` composable returns function that resolve the locale route.
 *
 * @remarks
 * The function returned by `useLocaleRoute` is the wrapper function with the same signature as {@link localeRoute}.
 *
 * @returns A {@link LocaleRouteFunction}.
 *
 * @public
 */
export function useLocaleRoute(): LocaleRouteFunction {
  return wrapComposable(localeRoute)
}

/**
 * The function that resolve locale location.
 *
 * @remarks
 * The parameter signature of this function is same as {@link localeLocation}.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns the location object for a given route, the location object is resolved by vue-router rather than just a full route path.
 *
 * @see {@link useLocaleLocation}
 *
 * @public
 */
export type LocaleLocationFunction = (route: RouteLocationRaw, locale?: Locale) => Location | RouteLocation | undefined

/**
 * The `useLocaleLocation` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useLocaleLocation` is the wrapper function with the same signature as {@link localeLocation}.
 *
 * @returns A {@link LocaleLocationFunction}.
 *
 * @public
 */
export function useLocaleLocation(): LocaleLocationFunction {
  return wrapComposable(localeLocation)
}

/**
 * The functin that swtich locale path.
 *
 * @remarks
 * The parameter signature of this function is same as {@link switchLocalePath}.
 *
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns A link to the current route in another language.
 *
 * @see {@link useSwitchLocalePath}
 *
 * @public
 */
export type SwitchLocalePathFunction = (locale: Locale) => string

/**
 * The `useSwitchLocalePath` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useSwitchLocalePath` is the wrapper function with the same signature as {@link switchLocalePath}.
 *
 * @returns A {@link SwitchLocalePathFunction}.
 *
 * @public
 */

export function useSwitchLocalePath(): SwitchLocalePathFunction {
  return wrapComposable(switchLocalePath)
}

/**
 * The `useBrowserLocale` composable returns the browser locale.
 *
 * @remarks
 * if this composable function is called on client-side, it detects the locale from the value of `navigator.languages`. Else on the server side, the locale is detected from the value of `accept-language` header.
 *
 * @returns the browser locale, if not detected, return `null`.
 *
 * @public
 */
export function useBrowserLocale(): string | null {
  const headers = useRequestHeaders(['accept-language'])
  return (
    findBrowserLocale(
      normalizedLocales,
      import.meta.client ? (navigator.languages as string[]) : parseAcceptLanguage(headers['accept-language'] || '')
    ) || null
  )
}

/**
 * The `useCookieLocale` composable returns the cookie locale.
 *
 * @remarks
 * If this composable function is called client-side, it detects the locale from the value of `document.cookie` via `useCookie`. Otherwise when used server-side, it detects the locale from the value of the `cookie` header.
 *
 * Note that if the value of `detectBrowserLanguage.useCookie` is `false`, an empty string is always returned.
 *
 * @returns the cookie locale with Vue `ref`. if not detected, return **empty string** with `ref`.
 *
 * @public
 */
export function useCookieLocale(): Ref<string> {
  // Support for importing from `#imports` is generated by auto `imports` nuxt module, so `ref` is imported from `vue`
  const locale: Ref<string> = ref('')
  const detect = runtimeDetectBrowserLanguage()

  if (detect && detect.useCookie) {
    const cookieKey = detect.cookieKey!

    let code: string | null = null
    if (import.meta.client) {
      code = useNuxtCookie<string>(cookieKey).value
    } else if (import.meta.server) {
      const cookie = useRequestHeaders(['cookie'])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      code = (cookie as any)[cookieKey]
    }

    if (code && localeCodes.includes(code)) {
      locale.value = code
    }
  }

  return locale
}

const warnRuntimeUsage = (method: string) =>
  console.warn(
    method +
      '() is a compiler-hint helper that is only usable inside ' +
      'the script block of a single file component. Its arguments should be ' +
      'compiled away and passing it at runtime has no effect.'
  )

/**
 * TODO:
 *  `paths`, `locales` completions like `unplugin-vue-router`
 *  ref: https://github.com/posva/unplugin-vue-router
 */

/**
 * The i18n custom route for page components
 */
export interface I18nRoute {
  /**
   * Customize page component routes per locale.
   *
   * @description You can specify static and dynamic paths for vue-router.
   */
  paths?: Partial<Record<Locale, string>>
  /**
   * Some locales to which the page component should be localized.
   */
  locales?: Locale[]
}

/**
 * Define custom route for page component
 *
 * @param route - The custom route
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defineI18nRoute(route: I18nRoute | false): void {
  if (import.meta.dev) {
    warnRuntimeUsage('defineI18nRoute')
  }
}

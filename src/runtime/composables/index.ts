import { useRequestHeaders, useCookie as useNuxtCookie, useNuxtApp } from '#imports'
import { ref, computed, watch, onUnmounted, unref } from 'vue'
import { parseAcceptLanguage, wrapComposable, runtimeDetectBrowserLanguage } from '../internal'
import { DEFAULT_DYNAMIC_PARAMS_KEY, localeCodes, normalizedLocales } from '#build/i18n.options.mjs'
import { getActiveHead } from 'unhead'
import { getNormalizedLocales, initCommonComposableOptions } from '../utils'
import {
  getAlternateOgLocales,
  getCanonicalLink,
  getCurrentOgLocale,
  getHreflangLinks,
  getOgUrl,
  localeHead
} from '../routing/compatibles/head'
import {
  getRouteBaseName,
  localeLocation,
  localePath,
  localeRoute,
  resolveRoute,
  switchLocalePath
} from '../routing/compatibles/routing'
import { findBrowserLocale } from '../routing/utils'
import { getComposer } from '../compatibility'

import type { Ref } from 'vue'
import type { Locale } from 'vue-i18n'
import type { I18nHeadMetaInfo, I18nHeadOptions, LocaleObject, SeoAttributesOptions } from '#internal-i18n-types'
import type { RouteLocationAsRelativeI18n, RouteLocationRaw, RouteLocationResolvedI18n, RouteMapI18n } from 'vue-router'
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
export function useSetI18nParams(seo?: SeoAttributesOptions): SetI18nParamsFunction {
  const common = initCommonComposableOptions()
  const nuxtApp = useNuxtApp()
  const head = getActiveHead()
  const router = common.router

  const locale = unref(nuxtApp.$i18n.locale)
  const locales = getNormalizedLocales(unref(nuxtApp.$i18n.locales))
  const _i18nParams = ref({})
  const experimentalSSR = common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR

  const i18nParams = computed({
    get() {
      return experimentalSSR ? common.metaState.value : router.currentRoute.value.meta[DEFAULT_DYNAMIC_PARAMS_KEY] ?? {}
    },
    set(val) {
      common.metaState.value = val
      _i18nParams.value = val
      router.currentRoute.value.meta[DEFAULT_DYNAMIC_PARAMS_KEY] = val
    }
  })

  const stop = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta[DEFAULT_DYNAMIC_PARAMS_KEY] = experimentalSSR
        ? common.metaState.value
        : _i18nParams.value
    }
  )

  onUnmounted(() => {
    stop()
  })

  const currentLocale: LocaleObject = getNormalizedLocales(locales).find(l => l.code === locale) || { code: locale }
  const currentLocaleLanguage = currentLocale.language

  if (!unref(nuxtApp.$i18n.baseUrl)) {
    console.warn('I18n `baseUrl` is required to generate valid SEO tag links.')
  }

  const setMeta = () => {
    const metaObject: HeadParam = {
      link: [],
      meta: []
    }

    // Adding SEO Meta
    if (locale && unref(nuxtApp.$i18n.locales)) {
      // Hard code to 'id', this is used to replace payload before ssr response
      const key = 'id'

      // prettier-ignore
      metaObject.link.push(
        ...getHreflangLinks(common, locales, key),
        ...getCanonicalLink(common, key, seo)
      )

      metaObject.meta.push(
        ...getOgUrl(common, key, seo),
        ...getCurrentOgLocale(currentLocale, currentLocaleLanguage, key),
        ...getAlternateOgLocales(locales, currentLocaleLanguage, key)
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
 * Returns localized head properties for locale-related aspects.
 *
 * @param common - Common options used internally by composable functions.
 * @param route
 * @param locale
 *
 * @returns Localized route
 *
 * @public
 * @deprecated use {@link localePath} or {@link localeRoute} instead
 */
export type ResolveRouteFunction = (route: RouteLocationRaw, locale?: Locale) => ReturnType<typeof resolveRoute>

/**
 * Returns localized head properties for locale-related tags.
 *
 * @param options - An options object, see {@link I18nHeadOption}.
 *
 * @returns The localized head properties.
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
  dir = true,
  lang = true,
  seo = true,
  key = 'hid'
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
    metaObject.value = localeHead(common, { dir, lang, seo, key })
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
 * @param givenRoute - A route location. The path or name of the route or an object for more complex routes.
 *
 * @returns The route base name, if route name is not defined, return `null`.
 *
 * @public
 */
export type RouteBaseNameFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | (Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }),
  /**
   * Note: disabled route path string autocompletion, this can break depending on `strategy`
   * this can be enabled again after route resolve has been improved.
   */
  // | RouteLocationAsStringI18n
  // | RouteLocationAsPathI18n
  locale?: Locale
) => string

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
  // @ts-expect-error - generated types conflict with the generic types we accept
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
 * @public
 */
export type LocalePathFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | (Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }),
  /**
   * Note: disabled route path string autocompletion, this can break depending on `strategy`
   * this can be enabled again after route resolve has been improved.
   */
  // | RouteLocationAsStringI18n
  // | RouteLocationAsPathI18n
  locale?: Locale
) => string

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
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localePath)
}

/**
 * Returns localized route for passed in `route` parameters.
 *
 * @remarks
 * If `locale` is not specified, uses current locale.
 *
 * @param route - A route.
 * @param locale - A {@link Locale | locale}, optional.
 *
 * @returns A route. if cannot resolve, `undefined` is returned.
 */
export type LocaleRouteFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | (Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }),
  /**
   * Note: disabled route path string autocompletion, this can break depending on `strategy`
   * this can be enabled again after route resolve has been improved.
   */
  // | RouteLocationAsStringI18n
  // | RouteLocationAsPathI18n
  locale?: Locale
) => RouteLocationResolvedI18n<Name> | undefined

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
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localeRoute)
}

/**
 * The function that resolve locale location.
 *
 * @param route - A route location. The path or name of the route or an object for more complex routes.
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns the location object for a given route, the location object is resolved by vue-router rather than just a full route path.
 *
 * @public
 * @deprecated use {@link localeRoute} instead
 */
export type LocaleLocationFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | (Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }),
  /**
   * Note: disabled route path string autocompletion, this can break depending on `strategy`
   * this can be enabled again after route resolve has been improved.
   */
  // | RouteLocationAsStringI18n
  // | RouteLocationAsPathI18n
  locale?: Locale
) => RouteLocationResolvedI18n<Name> | undefined

/**
 * The `useLocaleLocation` composable returns function that resolve the locale location.
 *
 * @remarks
 * The function returned by `useLocaleLocation` is the wrapper function with the same signature as {@link localeLocation}.
 *
 * @returns A {@link LocaleLocationFunction}.
 *
 * @public
 * @deprecated use {@link useLocaleRoute} instead
 */
export function useLocaleLocation(): LocaleLocationFunction {
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localeLocation)
}

/**
 * The function that switch locale path.
 *
 * @param locale - A locale optional, if not specified, uses the current locale.
 *
 * @returns A link to the current route in another language.
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
 * The i18n custom route for page components
 */
export interface I18nRoute {
  /**
   * Customize page component routes per locale.
   *
   * @description You can specify static and dynamic paths for vue-router.
   */
  paths?: Partial<Record<Locale, `/${string}`>>
  /**
   * Locales in which the page component should be localized.
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

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
} from '../routing/head'
import { getRouteBaseName, localePath, localeRoute, switchLocalePath } from '../routing/routing'
import { findBrowserLocale } from '../routing/utils'
import { getComposer } from '../compatibility'
import type { Ref } from 'vue'
import type { Locale } from 'vue-i18n'
import type { resolveRoute } from '../routing/routing'
import type { I18nHeadMetaInfo, I18nHeadOptions, LocaleObject, SeoAttributesOptions } from '#internal-i18n-types'
import type { HeadParam } from '../utils'
import type { RouteLocationAsRelativeI18n, RouteLocationRaw, RouteLocationResolvedI18n, RouteMapI18n } from 'vue-router'

export * from 'vue-i18n'
export * from './shared'

/**
 * Used to set i18n params for the current route.
 *
 * @params params - an object with {@link Locale} keys with localized parameters
 */
export type SetI18nParamsFunction = (params: Partial<Record<Locale, unknown>>) => void

/**
 * Returns a {@link SetI18nParamsFunction} used to set i18n params for the current route.
 *
 * @param options - An options object, see {@link SeoAttributesOptions}.
 *
 * @returns a {@link SetI18nParamsFunction}.
 */
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
        ...getHreflangLinks(common, locales, key, seo),
        ...getCanonicalLink(common, key, seo)
      )

      metaObject.meta.push(
        ...getOgUrl(common, key, seo),
        ...getCurrentOgLocale(currentLocale, currentLocale.language, key),
        ...getAlternateOgLocales(locales, currentLocale.language, key)
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
 * @param options - An options object, see {@link I18nHeadOptions}.
 *
 * @returns The localized head properties.
 */
export type LocaleHeadFunction = (options: I18nHeadOptions) => ReturnType<typeof localeHead>

/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An options object, see {@link I18nHeadOptions}
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties} with Vue `ref`.
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
 * NOTE: regarding composables accepting narrowed route arguments
 * route path string autocompletion is disabled as this can break depending on `strategy`
 * if route resolve is improved to work regardless of strategy this can be enabled again
 *
 * the following would be the complete narrowed type
 * route: Name | RouteLocationAsRelativeI18n | RouteLocationAsStringI18n | RouteLocationAsPathI18n
 */

type RouteLocationI18nGenericPath = Omit<RouteLocationAsRelativeI18n, 'path'> & { path?: string }

/**
 * Revoles a localized route object for the passed route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns Localized route object
 *
 * @deprecated use {@link useLocalePath}/{@link LocalePathFunction $localePath} or {@link useLocaleRoute}/{@link LocaleRouteFunction $localeRoute} instead
 */
export type ResolveRouteFunction = (route: RouteLocationRaw, locale?: Locale) => ReturnType<typeof resolveRoute>

/**
 * Resolves the route base name for the given route.
 *
 * @param route - a route name or route object.
 *
 * @returns Route base name (without localization suffix) or `undefined` if no name was found.
 */
export type RouteBaseNameFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath
) => string | undefined

/**
 * Returns a {@link RouteBaseNameFunction} used get the base name of a route.
 */
export function useRouteBaseName(): RouteBaseNameFunction {
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(getRouteBaseName)
}

/**
 * Resolves a localized path for the given route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns Returns the localized URL for a given route.
 */
export type LocalePathFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => string

/**
 * Returns a {@link LocalePathFunction} used to resolve a localized path.
 */
export function useLocalePath(): LocalePathFunction {
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localePath)
}

/**
 * Resolves a localized route object for the given route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns A route. if cannot resolve, `undefined` is returned.
 */
export type LocaleRouteFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => RouteLocationResolvedI18n<Name> | undefined

/**
 * Returns a {@link LocaleRouteFunction} used to resolve localized route objects.
 */
export function useLocaleRoute(): LocaleRouteFunction {
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localeRoute)
}

/**
 * Resolves a localized variant of the passed route.
 *
 * @param route - a route name or route object.
 * @param locale - (default: current locale).
 *
 * @returns A resolved route object
 *
 * @deprecated use {@link useLocaleRoute}/{@link LocaleRouteFunction $localeRoute} instead
 */
export type LocaleLocationFunction = <Name extends keyof RouteMapI18n = keyof RouteMapI18n>(
  route: Name | RouteLocationI18nGenericPath,
  locale?: Locale
) => RouteLocationResolvedI18n<Name> | undefined

/**
 * Returns a {@link LocaleLocationFunction} used to resolve localized route objects.
 *
 * @deprecated use {@link useLocaleRoute}/{@link LocaleRouteFunction $localeRoute} instead
 */
export function useLocaleLocation(): LocaleLocationFunction {
  // we wrap `localeRoute` as the implementation is identical
  // @ts-expect-error - generated types conflict with the generic types we accept
  return wrapComposable(localeRoute)
}

/**
 * Resolves a localized variant of the current path.
 *
 * @param locale - (default: current locale).
 */
export type SwitchLocalePathFunction = (locale: Locale) => string

/**
 * Returns a {@link SwitchLocalePathFunction} used to resolve a localized variant of the current path.
 */
export function useSwitchLocalePath(): SwitchLocalePathFunction {
  return wrapComposable(switchLocalePath)
}

/**
 * Return the browser locale based on `navigator.languages` (client-side) or `accept-language` header (server-side).
 *
 * @returns the browser locale, if not detected, return `null`.
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
 * Returns the locale cookie based on `document.cookie` (client-side) or `cookie` header (server-side).
 *
 * @remark
 * If `detectBrowserLanguage.useCookie` is `false` this will always return an empty string.
 *
 * @returns a `Ref<string>` with the detected cookie or an empty string if none is detected.
 */
export function useCookieLocale(): Ref<string> {
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

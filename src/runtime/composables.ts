import { findBrowserLocale, getComposer } from 'vue-i18n-routing'
import { useRoute, useRouter, useRequestHeaders, useCookie, useNuxtApp } from '#imports'
import { ref } from 'vue'
import { parseAcceptLanguage } from '#build/i18n.internal.mjs'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault, localeCodes as _localeCodes } from '#build/i18n.options.mjs'
import {
  useRouteBaseName as _useRouteBaseName,
  useLocalePath as _useLocalePath,
  useLocaleRoute as _useLocaleRoute,
  useSwitchLocalePath as _useSwitchLocalePath,
  useLocaleHead as _useLocaleHead
} from 'vue-i18n-routing'

import type { Ref } from 'vue'
import type { DetectBrowserLanguageOptions } from '#build/i18n.options.mjs'

export * from 'vue-i18n'
export type { LocaleObject } from 'vue-i18n-routing'
import type { Locale, LocaleMessages, DefineLocaleMessage, I18nOptions } from 'vue-i18n'

/**
 * The `useRouteBaseName` composable returns a function that gets the route's base name.
 *
 * @remarks
 * The function returned by `useRouteBaseName` is the wrapper function with the same signature as {@link getRouteBaseName}.
 *
 * `useRouteBaseName` is powered by [vue-i18n-routing](https://github.com/intlify/routing/tree/main/packages/vue-i18n-routing).
 *
 * @param options - An options object, see {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link RouteBaseNameFunction}.
 *
 * @public
 */
export function useRouteBaseName(
  options?: Pick<NonNullable<Parameters<typeof _useRouteBaseName>[0]>, 'route' | 'router' | 'i18n'>
): ReturnType<typeof _useRouteBaseName> {
  const { route, router, i18n } = options || {}
  return _useRouteBaseName({
    route: route || useRoute(),
    router: router || useRouter(),
    i18n: i18n || getComposer(useNuxtApp().$i18n)
  })
}

/**
 * The `useLocalePath` composable returns a function that resolves a path according to the current locale.
 *
 * @remarks
 * The function returned by `useLocalePath` is the wrapper function with the same signature as {@link localePath}.
 *
 * `useLocalePath` is powered by [vue-i18n-routing](https://github.com/intlify/routing/tree/main/packages/vue-i18n-routing).
 *
 * @param options - An options object, see {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link LocalePathFunction}.
 *
 * @public
 */
export function useLocalePath(
  options?: Pick<NonNullable<Parameters<typeof _useLocalePath>[0]>, 'route' | 'router' | 'i18n'>
): ReturnType<typeof _useLocalePath> {
  const { route, router, i18n } = options || {}
  return _useLocalePath({
    route: route || useRoute(),
    router: router || useRouter(),
    i18n: i18n || getComposer(useNuxtApp().$i18n)
  })
}

/**
 * The `useLocaleRoute` composable returns a function that resolves the route according to the current locale.
 *
 * @remarks
 * The function returned by `useLocaleRoute` is the wrapper function with the same signature as {@link localeRoute}.
 *
 * `useLocaleRoute` is powered by [vue-i18n-routing](https://github.com/intlify/routing/tree/main/packages/vue-i18n-routing).
 *
 * @param options - An options object, see {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link LocaleRouteFunction}.
 *
 * @public
 */
export function useLocaleRoute(
  options?: Pick<NonNullable<Parameters<typeof _useLocaleRoute>[0]>, 'route' | 'router' | 'i18n'>
): ReturnType<typeof _useLocaleRoute> {
  const { route, router, i18n } = options || {}
  return _useLocaleRoute({
    route: route || useRoute(),
    router: router || useRouter(),
    i18n: i18n || getComposer(useNuxtApp().$i18n)
  })
}

/**
 * The `useSwitchLocalePath` composable returns a function that allows to switch the locale.
 *
 * @remarks
 * The function returned by `useSwitchLocalePath` is the wrapper function with the same signature as {@link switchLocalePath}.
 *
 * `useSwitchLocalePath` composable returns function that resolve the locale location. `useSwitchLocalePath` is powered by [vue-i18n-routing](https://github.com/intlify/routing/tree/main/packages/vue-i18n-routing).
 *
 * @param options - An options object, see {@link I18nCommonRoutingOptionsWithComposable}
 *
 * @returns A {@link SwitchLocalePathFunction}.
 *
 * @public
 */
export function useSwitchLocalePath(
  options?: Pick<NonNullable<Parameters<typeof _useSwitchLocalePath>[0]>, 'route' | 'router' | 'i18n'>
): ReturnType<typeof _useSwitchLocalePath> {
  const { route, router, i18n } = options || {}
  return _useSwitchLocalePath({
    route: route || useRoute(),
    router: router || useRouter(),
    i18n: i18n || getComposer(useNuxtApp().$i18n)
  })
}

/**
 * The `useLocaleHead` composable returns localized head properties for locale-related aspects.
 *
 * @param options - An options object, see {@link I18nHeadOptions}.
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties} with Vue `ref`.
 *
 * @public
 */
export function useLocaleHead(
  options?: Pick<
    NonNullable<Parameters<typeof _useLocaleHead>[0]>,
    'addDirAttribute' | 'addSeoAttributes' | 'identifierAttribute' | 'route' | 'router' | 'i18n'
  >
): ReturnType<typeof _useLocaleHead> {
  const { addDirAttribute, addSeoAttributes, identifierAttribute, route, router, i18n } = options || {}
  return _useLocaleHead({
    addDirAttribute: addDirAttribute || false,
    addSeoAttributes: addSeoAttributes || false,
    identifierAttribute: identifierAttribute || 'hid',
    route: route || useRoute(),
    router: router || useRouter(),
    i18n: i18n || getComposer(useNuxtApp().$i18n)
  })
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
export function useBrowserLocale(normalizedLocales = nuxtI18nInternalOptions.__normalizedLocales): string | null {
  const headers = useRequestHeaders(['accept-language'])
  return (
    findBrowserLocale(
      normalizedLocales,
      process.client ? (navigator.languages as string[]) : parseAcceptLanguage(headers['accept-language'] || '')
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
export function useCookieLocale(
  options: Required<Pick<DetectBrowserLanguageOptions, 'useCookie' | 'cookieKey'>> & {
    localeCodes: readonly string[]
  } = {
    useCookie: nuxtI18nOptionsDefault.detectBrowserLanguage.useCookie,
    cookieKey: nuxtI18nOptionsDefault.detectBrowserLanguage.cookieKey,
    localeCodes: _localeCodes
  }
): Ref<string> {
  // Support for importing from `#imports` is generated by auto `imports` nuxt module, so `ref` is imported from `vue`
  const locale: Ref<string> = ref('')

  if (options.useCookie) {
    let code: string | null = null
    if (process.client) {
      const cookie = useCookie<string>(options.cookieKey) as Ref<string>
      code = cookie.value
    } else if (process.server) {
      const cookie = useRequestHeaders(['cookie'])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code = (cookie as any)[options.cookieKey]
    }

    if (code && options.localeCodes.includes(code)) {
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
  paths?: Record<Locale, string>
  /**
   * Some locales to which the page component should be localized.
   */
  locales?: string[]
}

/**
 * Define custom route for page component
 *
 * @param route - The custom route
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defineI18nRoute(route: I18nRoute | false): void {
  if (process.dev) {
    warnRuntimeUsage('defineI18nRoute')
  }
}

type MaybePromise<T> = T | Promise<T>

/**
 * The `defineI18nLocale` defines a composable function to dynamically load locale messages.
 *
 * @remarks
 * This function is used to dynamically load a locale with lazy-load translations.
 *
 * You can use at JavaScript and TypeScript extension formats.
 *
 * @param locale - A target locale that is passed from nuxt i18n module.
 *
 * @returns Returns the locale messages object that will be resolved with Promise.
 */
export type LocaleLoader<Messages = LocaleMessages<DefineLocaleMessage>, Locales = Locale> = (
  locale: Locales
) => MaybePromise<Messages>

/**
 * Define locale loader for dynamic locale messages loading
 *
 * @param locale - The target locale
 *
 * @returns The defined locale
 */
export function defineI18nLocale<Messages = LocaleMessages<DefineLocaleMessage>, Locales = Locale>(
  locale: LocaleLoader<Messages, Locales>
): LocaleLoader<Messages, Locales> {
  return locale
}

/**
 * The `defineI18nConfig` defines a composable function to vue-i18n configuration.
 *
 * @remarks
 * This function is used to pass the `createI18n` options on nuxt i18n module.
 *
 * For more details about configuration, see the [Vue I18n documentation](https://vue-i18n.intlify.dev/api/general.html#createi18n).
 *
 * @returns Return vue-i18n options object that will be resolved by Promise.
 */
export type ConfigLoader<Config extends I18nOptions> = () => MaybePromise<Config>

/**
 * Define configuration for vue-i18n runtime plugin
 *
 * @param config - The target configuration for vue-i18n
 *
 * @returns The defined configuration
 */
export function defineI18nConfig<Config extends I18nOptions>(config: ConfigLoader<Config>): ConfigLoader<Config> {
  return config
}

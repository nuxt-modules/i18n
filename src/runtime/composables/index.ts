import { useRoute, useRequestHeaders, useCookie } from '#imports'
import { ref, computed, watch, onUnmounted } from 'vue'
import { parseAcceptLanguage } from '../internal'
import { nuxtI18nInternalOptions, nuxtI18nOptionsDefault, localeCodes as _localeCodes } from '#build/i18n.options.mjs'
import { getActiveHead } from 'unhead'
import { useI18n } from 'vue-i18n'

import type { Ref } from 'vue'
import type { DetectBrowserLanguageOptions, SeoAttributesOptions } from '#build/i18n.options.mjs'

export * from 'vue-i18n'
export * from './shared'

import type { Locale } from 'vue-i18n'
import { getNormalizedLocales, type HeadParam } from '../utils'
import {
  getAlternateOgLocales,
  getCanonicalLink,
  getCurrentOgLocale,
  getHreflangLinks,
  getOgUrl
} from '../routing/compatibles'
import { findBrowserLocale, getLocale, getLocales } from '../routing/utils'
import { useLocaleHead as _useLocaleHead } from '../routing/composables'

export { useRouteBaseName, useLocalePath, useLocaleRoute, useSwitchLocalePath } from '../routing/composables'

/**
 * Returns a function to set i18n params.
 *
 * @param options - An options object, see {@link SeoAttributesOptions}.
 *
 * @returns a {@link SetI18nParamsFunction}.
 *
 * @public
 */
export type SetI18nParamsFunction = (params: Record<string, unknown>) => void
export function useSetI18nParams(seoAttributes?: SeoAttributesOptions): SetI18nParamsFunction {
  const route = useRoute()
  // const router = useRouter()
  const head = getActiveHead()

  const i18n = useI18n()
  const locale = getLocale(i18n)
  const locales = getNormalizedLocales(getLocales(i18n))
  const _i18nParams = ref({})

  const i18nParams = computed({
    get() {
      return route.meta.nuxtI18n ?? {}
    },
    set(val) {
      _i18nParams.value = val
      route.meta.nuxtI18n = val
    }
  })

  const stop = watch(
    () => route.fullPath,
    () => {
      route.meta.nuxtI18n = _i18nParams.value
    }
  )

  onUnmounted(() => {
    stop()
  })

  const currentLocale = getNormalizedLocales(locales).find(l => l.code === locale) || { code: locale }
  const currentLocaleIso = currentLocale.iso

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
        ...getHreflangLinks(locales, idAttribute),
        ...getCanonicalLink(idAttribute, seoAttributes)
      )

      metaObject.meta.push(
        ...getOgUrl(idAttribute, seoAttributes),
        ...getCurrentOgLocale(currentLocale, currentLocaleIso, idAttribute),
        ...getAlternateOgLocales(locales, currentLocaleIso, idAttribute)
      )
    }

    head?.push(metaObject)
  }

  return function (params: Record<string, unknown>) {
    i18nParams.value = { ...params }
    setMeta()
  }
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
    'addDirAttribute' | 'addSeoAttributes' | 'identifierAttribute'
  >
): ReturnType<typeof _useLocaleHead> {
  const { addDirAttribute, addSeoAttributes, identifierAttribute } = options || {}
  return _useLocaleHead({
    addDirAttribute: addDirAttribute || false,
    addSeoAttributes: addSeoAttributes || false,
    identifierAttribute: identifierAttribute || 'hid'
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

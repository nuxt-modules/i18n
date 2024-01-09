/* eslint-disable @typescript-eslint/no-explicit-any */

import { isString, isSymbol, isFunction } from '@intlify/shared'

import type { LocaleObject, Strategies, BaseUrlResolveHandler, I18nRoutingOptions } from './types'
import type { useRoute, useRouter, RouteLocationNormalizedLoaded, Route } from '@intlify/vue-router-bridge'
import type { Composer, ExportedGlobalComposer, I18n, Locale, VueI18n } from 'vue-i18n'
import { isRef, type Ref } from 'vue'
const isVueRouter4 = true
/**
 * @public
 */
export type I18nCommonRoutingOptions = Pick<
  I18nRoutingOptions,
  'defaultLocale' | 'strategy' | 'defaultLocaleRouteNameSuffix' | 'trailingSlash' | 'locales' | 'routesNameSeparator'
>

/**
 * @public
 */
export interface ComposableOptions {
  /**
   * vue-router route instance, which is returned with `useRoute`.
   */
  route?: ReturnType<typeof useRoute>
  /**
   * vue-router router instance, which is returned with `useRouter`.
   */
  router?: ReturnType<typeof useRouter>
  /**
   * vue-i18n Composer instance.
   */
  i18n?: Composer
}

/**
 * @public
 */
export type I18nCommonRoutingOptionsWithComposable = I18nCommonRoutingOptions & ComposableOptions

export const inBrowser = typeof window !== 'undefined'

export function warn(msg: string, err?: Error): void {
  if (typeof console !== 'undefined') {
    console.warn(`[vue-i18n-routing] ` + msg)
    /* istanbul ignore if */
    if (err) {
      console.warn(err.stack)
    }
  }
}

export function getNormalizedLocales(locales: string[] | LocaleObject[]): LocaleObject[] {
  locales = locales || []
  const normalized: LocaleObject[] = []
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale })
    } else {
      normalized.push(locale)
    }
  }
  return normalized
}

export function isI18nInstance(i18n: any): i18n is I18n {
  return i18n != null && 'global' in i18n && 'mode' in i18n
}

export function isComposer(target: any): target is Composer {
  return target != null && !('__composer' in target) && isRef(target.locale)
}

export function isVueI18n(target: any): target is VueI18n {
  return target != null && '__composer' in target
}

export function isExportedGlobalComposer(target: any): target is ExportedGlobalComposer {
  return target != null && !('__composer' in target) && !isRef(target.locale)
}

export function isLegacyVueI18n(target: any): target is Pick<VueI18n, 'locale'> {
  return target != null && ('__VUE_I18N_BRIDGE__' in target || '_sync' in target)
}

export function getComposer(i18n: I18n | VueI18n | Composer): Composer {
  // prettier-ignore
  return isI18nInstance(i18n)
    ? isComposer(i18n.global)
      ? i18n.global
      : ((i18n.global as any).__composer as Composer)
    : isVueI18n(i18n)
      ? ((i18n as any).__composer as Composer)
      : i18n
}

const isVue2 = false

/**
 * Get a locale
 *
 * @param i18n - An [I18n](https://vue-i18n.intlify.dev/api/general.html#i18n) instance or a [Composer](https://vue-i18n.intlify.dev/api/composition.html#composer) instance
 *
 * @returns A locale
 */
export function getLocale(i18n: I18n | Composer | VueI18n): Locale {
  // TODO: we might re-design `getLocale` for vue-i18n-next & vue-i18n-bridge (legacy mode & Vue 2)
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  return isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.locale
      : target.locale.value
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? target.locale
      : (target as any).locale // TODO:
}

export function getLocales(i18n: I18n | VueI18n | Composer): string[] | LocaleObject[] {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  return isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.locales
      : (target as any).locales.value
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? (target as any).locales
      : (target as any).locales // TODO:
}

export function getLocaleCodes(i18n: I18n | VueI18n | Composer): string[] {
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  // prettier-ignore
  return isComposer(target)
    ? isVue2 && isLegacyVueI18n(i18n)
      ? i18n.localeCodes
      : (target as any).localeCodes.value
    : isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)
      ? (target as any).localeCodes
      : (target as any).localeCodes // TODO:
}

/**
 * Set a locale
 *
 * @param i18n - An [I18n](https://vue-i18n.intlify.dev/api/general.html#i18n) instance or a [Composer](https://vue-i18n.intlify.dev/api/composition.html#composer) instance
 * @param locale - A target locale
 */
export function setLocale(i18n: I18n | Composer, locale: Locale): void {
  // console.log('setLocale', i18n)
  const target: unknown = isI18nInstance(i18n) ? i18n.global : i18n
  if (isComposer(target)) {
    // TODO: we might re-design `setLocale` for vue-i18n-next & vue-i18n-bridge (legacy mode & Vue 2)
    if (isVue2 && isLegacyVueI18n(i18n)) {
      i18n.locale = locale
    } else {
      target.locale.value = locale
    }
  } else if (isExportedGlobalComposer(target) || isVueI18n(target) || isLegacyVueI18n(target)) {
    target.locale = locale
  } else {
    throw new Error('TODO:')
  }
}

// Language: typescript
export function adjustRoutePathForTrailingSlash(
  pagePath: string,
  trailingSlash: boolean,
  isChildWithRelativePath: boolean
) {
  return pagePath.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
}

export function toRawRoute(
  maybeRoute: Ref<RouteLocationNormalizedLoaded> | Route
): RouteLocationNormalizedLoaded | Route {
  return isVueRouter4
    ? isRef(maybeRoute)
      ? maybeRoute.value
      : maybeRoute
    : isRef(maybeRoute)
      ? maybeRoute.value
      : maybeRoute
}

export function getRouteName(routeName?: string | symbol | null) {
  // prettier-ignore
  return isString(routeName)
    ? routeName
    : isSymbol(routeName)
      ? routeName.toString()
      : '(null)'
}

export function getLocaleRouteName(
  routeName: symbol | string | null | undefined,
  locale: Locale,
  {
    defaultLocale,
    strategy,
    routesNameSeparator,
    defaultLocaleRouteNameSuffix
  }: { defaultLocale: string; strategy: Strategies; routesNameSeparator: string; defaultLocaleRouteNameSuffix: string }
) {
  let name = getRouteName(routeName) + (strategy === 'no_prefix' ? '' : routesNameSeparator + locale)
  if (locale === defaultLocale && strategy === 'prefix_and_default') {
    name += routesNameSeparator + defaultLocaleRouteNameSuffix
  }
  return name
}

/**
 * Resolve base url
 *
 * @param baseUrl - A base url to resolve on SEO and domain. if you want to resolve with dynamically, you can spacify {@link BaseUrlResolveHandler}
 * @param context - A context to resolve base url, if you want to resolve base url with {@link BaseUrlResolveHandler}
 *
 * @returns A resolved base url
 */
export function resolveBaseUrl<Context = unknown>(baseUrl: string | BaseUrlResolveHandler<Context>, context: Context) {
  if (isFunction(baseUrl)) {
    return baseUrl(context)
  }
  return baseUrl
}

/**
 * The browser locale info
 *
 * @remarks
 * This type is used by {@link FindBrowserLocaleOptions#sorter | sorter} in {@link findBrowserLocale} function
 */
export interface BrowserLocale {
  /**
   * The locale code, such as BCP 47 (e.g `en-US`), or `ja`
   */
  code: string
  /**
   * The score number
   *
   * @remarks
   * The score number that is used by `sorter` of {@link FindBrowserLocaleOptions}
   */
  score: number
}

/**
 * The target locale info
 *
 * @remarks
 * This type is used by {@link BrowserLocaleMatcher} first argument
 */
export type TargetLocale = Required<Pick<LocaleObject, 'code' | 'iso'>>

/**
 * The browser locale matcher
 *
 * @remarks
 * This matcher is used by {@link findBrowserLocale} function
 *
 * @param locales - The target {@link LocaleObject | locale} list
 * @param browserLocales - The locale code list that is used in browser
 *
 * @returns The matched {@link BrowserLocale | locale info}
 */
export type BrowserLocaleMatcher = (locales: TargetLocale[], browserLocales: string[]) => BrowserLocale[]

/**
 * The options for {@link findBrowserLocale} function
 */
export interface FindBrowserLocaleOptions {
  matcher?: BrowserLocaleMatcher
  comparer?: (a: BrowserLocale, b: BrowserLocale) => number
}

function matchBrowserLocale(locales: TargetLocale[], browserLocales: string[]): BrowserLocale[] {
  const matchedLocales = [] as BrowserLocale[]

  // first pass: match exact locale.
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = locales.find(l => l.iso.toLowerCase() === browserCode.toLowerCase())
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length })
      break
    }
  }

  // second pass: match only locale code part of the browser locale (not including country).
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split('-')[0].toLowerCase()
    const matchedLocale = locales.find(l => l.iso.split('-')[0].toLowerCase() === languageCode)
    if (matchedLocale) {
      // deduct a thousandth for being non-exact match.
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length })
      break
    }
  }

  return matchedLocales
}

/**
 * The default browser locale matcher
 */
export const DefaultBrowserLocaleMatcher = matchBrowserLocale

function compareBrowserLocale(a: BrowserLocale, b: BrowserLocale): number {
  if (a.score === b.score) {
    // if scores are equal then pick more specific (longer) code.
    return b.code.length - a.code.length
  }
  return b.score - a.score
}

/**
 * The default browser locale comparer
 */
export const DefaultBrowerLocaleComparer = compareBrowserLocale

/**
 * Find the browser locale
 *
 * @param locales - The target {@link LocaleObject | locale} list
 * @param browserLocales - The locale code list that is used in browser
 * @param options - The options for {@link findBrowserLocale} function
 *
 * @returns The matched the locale code
 */
export function findBrowserLocale(
  locales: LocaleObject[],
  browserLocales: string[],
  { matcher = DefaultBrowserLocaleMatcher, comparer = DefaultBrowerLocaleComparer }: FindBrowserLocaleOptions = {}
): string | '' {
  const normalizedLocales = []
  for (const l of locales) {
    const { code } = l
    const iso = l.iso || code
    normalizedLocales.push({ code, iso })
  }

  // finding!
  const matchedLocales = matcher(normalizedLocales, browserLocales)

  // sort!
  if (matchedLocales.length > 1) {
    matchedLocales.sort(comparer)
  }

  return matchedLocales.length ? matchedLocales[0].code : ''
}

/* eslint-enable @typescript-eslint/no-explicit-any */

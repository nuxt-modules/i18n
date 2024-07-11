/* eslint-disable @typescript-eslint/no-explicit-any */

import { isString, isSymbol, isFunction } from '@intlify/shared'
import { isRef } from '#imports'

import type { LocaleObject, Strategies, BaseUrlResolveHandler } from '#build/i18n.options.mjs'
import type { Composer, I18n, Locale, VueI18n } from 'vue-i18n'

export const inBrowser = typeof window !== 'undefined'

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

function isI18nInstance(i18n: I18n | VueI18n | Composer): i18n is I18n {
  return i18n != null && 'global' in i18n && 'mode' in i18n
}

function isComposer(target: I18n | VueI18n | Composer): target is Composer {
  return target != null && !('__composer' in target) && 'locale' in target && isRef(target.locale)
}

export function isVueI18n(target: I18n | VueI18n | Composer): target is VueI18n {
  return target != null && '__composer' in target
}

export function getI18nTarget(i18n: I18n | VueI18n | Composer) {
  return isI18nInstance(i18n) ? i18n.global : i18n
}

export function getComposer(i18n: I18n | VueI18n | Composer): Composer {
  const target = getI18nTarget(i18n)

  if (isComposer(target)) return target
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (isVueI18n(target)) return (target as any).__composer as Composer

  return target
}

export function adjustRoutePathForTrailingSlash(
  pagePath: string,
  trailingSlash: boolean,
  isChildWithRelativePath: boolean
) {
  return pagePath.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
}

export function getRouteName(routeName?: string | symbol | null) {
  if (isString(routeName)) return routeName
  if (isSymbol(routeName)) return routeName.toString()
  return '(null)'
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
): string {
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

export function getLocalesRegex(localeCodes: string[]) {
  return new RegExp(`^/(${localeCodes.join('|')})(?:/|$)`, 'i')
}

/* eslint-enable @typescript-eslint/no-explicit-any */

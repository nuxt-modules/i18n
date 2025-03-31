import { isString } from '@intlify/shared'
import { localeCodes } from '#build/i18n.options.mjs'
import { useRuntimeConfig } from '#app'

import type { LocaleObject, I18nPublicRuntimeConfig } from '#internal-i18n-types'
import type { Locale } from 'vue-i18n'
import type { CompatRoute } from '../types'
import type { RouteRecordNameGeneric } from 'vue-router'

export function getRouteName(routeName?: RouteRecordNameGeneric) {
  if (isString(routeName)) return routeName
  if (routeName != null) return routeName.toString()
  return '(null)'
}

export function getLocaleRouteName(routeName: RouteRecordNameGeneric, locale: Locale, opts: I18nPublicRuntimeConfig) {
  const { defaultLocale, strategy, routesNameSeparator, defaultLocaleRouteNameSuffix, differentDomains } = opts
  const localizedRoutes = strategy !== 'no_prefix' || differentDomains
  const name = getRouteName(routeName) + (localizedRoutes ? routesNameSeparator + locale : '')
  if (locale === defaultLocale && strategy === 'prefix_and_default') {
    return name + routesNameSeparator + defaultLocaleRouteNameSuffix
  }
  return name
}

/**
 * The browser locale code and match score
 */
interface BrowserLocale {
  /** The locale code, such as BCP 47 (e.g `en-US`), or `ja` */
  code: string
  /** The match score - used to sort multiple matched locales */
  score: number
}

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
function matchBrowserLocale(locales: LocaleObject[], browserLocales: readonly string[]): BrowserLocale[] {
  const matchedLocales: BrowserLocale[] = []

  // first pass: match exact locale.
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedLocale = locales.find(l => l.language?.toLowerCase() === browserCode.toLowerCase())
    if (matchedLocale) {
      matchedLocales.push({ code: matchedLocale.code, score: 1 - index / browserLocales.length })
      break
    }
  }

  // second pass: match only locale code part of the browser locale (not including country).
  for (const [index, browserCode] of browserLocales.entries()) {
    const languageCode = browserCode.split('-')[0].toLowerCase()
    const matchedLocale = locales.find(l => l.language?.split('-')[0].toLowerCase() === languageCode)
    if (matchedLocale) {
      // deduct a thousandth for being non-exact match.
      matchedLocales.push({ code: matchedLocale.code, score: 0.999 - index / browserLocales.length })
      break
    }
  }

  return matchedLocales
}

function compareBrowserLocale(a: BrowserLocale, b: BrowserLocale): number {
  if (a.score === b.score) {
    // if scores are equal then pick more specific (longer) code.
    return b.code.length - a.code.length
  }
  return b.score - a.score
}

/**
 * Find the browser locale
 *
 * @param locales - The target {@link LocaleObject} list
 * @param browserLocales - The locale code list that is used in browser
 *
 * @returns The matched the locale code
 */
export function findBrowserLocale(locales: LocaleObject[], browserLocales: readonly string[]): string {
  const normalizedLocales = locales.map(l => ({ code: l.code, language: l.language || l.code }))
  const matchedLocales = matchBrowserLocale(normalizedLocales, browserLocales)
  if (matchedLocales.length === 0) {
    return ''
  }

  // sort by score when multiple locales matched
  if (matchedLocales.length > 1) {
    matchedLocales.sort(compareBrowserLocale)
  }

  return matchedLocales[0].code
}

export function getLocalesRegex(localeCodes: string[]) {
  return new RegExp(`^/(${localeCodes.join('|')})(?:/|$)`, 'i')
}

const localesPattern = `(${localeCodes.join('|')})`
export const regexpPath = getLocalesRegex(localeCodes)

export function createLocaleFromRouteGetter() {
  const { routesNameSeparator, defaultLocaleRouteNameSuffix } = useRuntimeConfig().public.i18n
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`
  const regexpName = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, 'i')

  /**
   * extract locale code from route name or path
   */
  return (route: string | CompatRoute) => {
    if (isString(route)) {
      return route.match(regexpPath)?.[1] ?? ''
    }
    // extract from route name
    if (route.name) {
      return getRouteName(route.name).match(regexpName)?.[1] ?? ''
    }
    // extract from path
    if (route.path) {
      return route.path.match(regexpPath)?.[1] ?? ''
    }
    return ''
  }
}

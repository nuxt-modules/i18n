import type { BrowserLocale, Locale } from './types'

/**
 * The browser locale matcher
 *
 * @param locales - The target {@link LocaleObject | locale} list
 * @param browserLocales - The locale code list that is used in browser
 *
 * @returns The matched {@link BrowserLocale | locale info}
 */
function matchBrowserLocale(locales: Locale[], browserLocales: readonly string[]): BrowserLocale[] {
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
    const languageCode = browserCode.split('-')[0]!.toLowerCase()
    const matchedLocale = locales.find(l => l.language?.split('-')[0]!.toLowerCase() === languageCode)
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
 * @param locales - The target {@link Locale} list
 * @param browserLocales - The locale code list that is used in browser
 *
 * @returns The matched the locale code
 * @internal
 */
export function findBrowserLocale(locales: Locale[], browserLocales: readonly string[]): string {
  const matchedLocales = matchBrowserLocale(
    locales.map(l => ({ code: l.code, language: l.language || l.code })),
    browserLocales
  )

  return matchedLocales.sort(compareBrowserLocale).at(0)?.code ?? ''
}

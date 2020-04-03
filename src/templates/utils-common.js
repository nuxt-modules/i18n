/**
 * Parses locales provided from browser through `accept-language` header.
 * @param {string} input
 * @return {string[]} An array of locale codes. Priority determined by order in array.
 **/
export const parseAcceptLanguage = input => {
  // Example input: en-US,en;q=0.9,nb;q=0.8,no;q=0.7
  // Contains tags separated by comma.
  // Each tag consists of locale code (2-3 letter language code) and optionally country code
  // after dash. Tag can also contain score after semicolon, that is assumed to match order
  // so it's not explicitly used.
  return input.split(',').map(tag => tag.split(';')[0])
}

/**
 * Find locale code that best matches provided list of browser locales.
 * @param {string[]} appLocales The user-configured locale codes that are to be matched.
 * @param {string[]} browserLocales The locales to match against configured.
 * @return {string?}
 **/
export const matchBrowserLocale = (appLocales, browserLocales) => {
  /** @type {{ code: string, score: number }[]} */
  const matchedLocales = []

  // First pass: match exact locale.
  for (const [index, browserCode] of browserLocales.entries()) {
    const matchedCode = appLocales.find(appCode => appCode.toLowerCase() === browserCode.toLowerCase())
    if (matchedCode) {
      matchedLocales.push({ code: matchedCode, score: 1 - index / browserLocales.length })
      break
    }
  }

  // Second pass: match only locale code part of the browser locale (not including country).
  for (const [index, browserCode] of browserLocales.entries()) {
    if (browserCode.includes('-')) {
      // For backwards-compatibility, this is lower-cased before comparing.
      const languageCode = browserCode.split('-')[0].toLowerCase()

      if (appLocales.includes(languageCode)) {
        // Deduct a thousandth for being non-exact match.
        matchedLocales.push({ code: languageCode, score: 0.999 - index / browserLocales.length })
        break
      }
    }
  }

  // Sort the list by score (0 - lowest, 1 - highest).
  if (matchedLocales.length > 1) {
    matchedLocales.sort((localeA, localeB) => {
      if (localeA.score === localeB.score) {
        // If scores are equal then pick more specific (longer) code.
        return localeB.code.length - localeA.code.length
      }

      return localeB.score - localeA.score
    })
  }

  return matchedLocales.length ? matchedLocales[0].code : null
}

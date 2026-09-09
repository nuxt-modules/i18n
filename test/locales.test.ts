import { describe, expect, test, vi } from 'vitest'

vi.mock('#build/i18n-options.mjs', () => ({
  localeCodes: ['en', 'en-US', 'de-DE', 'de', 'ja'],
  localeLoaders: {},
  normalizedLocales: [],
}))

const { getFallbackLocaleCodes } = await import('../src/runtime/shared/locales')

describe('getFallbackLocaleCodes', () => {
  test('(#regression) a region-tagged locale implicitly falls back to its base tag, when that base tag is a configured locale', () => {
    // `en` is configured alongside `en-US` here, so vue-i18n's own implicit chain (`en-US` tries
    // `en` before consulting `fallbackLocale`) needs `en`'s messages loaded too, or content that
    // exists there is silently skipped straight to the configured fallback
    expect(getFallbackLocaleCodes({ default: ['ja'] }, ['en-US'])).toEqual(['en', 'ja'])
    expect(getFallbackLocaleCodes(['ja'], ['en-US'])).toEqual(['en', 'ja'])
    expect(getFallbackLocaleCodes('ja', ['en-US'])).toEqual(['en', 'ja'])
    expect(getFallbackLocaleCodes(false, ['en-US'])).toEqual(['en'])
  })

  test('does not add a base tag that was never configured as its own locale', () => {
    // no `fr` locale is configured here, so there's no file to load for it, widening the
    // lazy-loading footprint for a tag nobody defined isn't worth it
    expect(getFallbackLocaleCodes({ default: ['ja'] }, ['fr-CA'])).toEqual(['ja'])
    expect(getFallbackLocaleCodes(false, ['fr-CA'])).toEqual([])
  })

  test('a plain locale with no region tag gets no implicit fallback', () => {
    expect(getFallbackLocaleCodes(false, ['en'])).toEqual([])
    expect(getFallbackLocaleCodes({ default: ['ja'] }, ['en'])).toEqual(['ja'])
  })

  test('walks multiple dash-separated levels, only keeping tags that are configured (`de-DE-bavarian` -> `de-DE` -> `de`)', () => {
    expect(getFallbackLocaleCodes(false, ['de-DE-bavarian'])).toEqual(['de-DE', 'de'])
  })

  test('does not duplicate a base tag that is already an explicit locale', () => {
    expect(getFallbackLocaleCodes({ default: ['ja'] }, ['en-US', 'en'])).toEqual(['ja'])
  })

  test('(#regression) does not duplicate a base tag the user also lists explicitly', () => {
    // writing `en` explicitly here achieves exactly what the base-tag walk already adds on its
    // own, so the two sources overlap and need deduping rather than appearing twice
    expect(getFallbackLocaleCodes({ 'en-US': ['en'] }, ['en-US'])).toEqual(['en'])
    expect(getFallbackLocaleCodes(['en'], ['en-US'])).toEqual(['en'])
    expect(getFallbackLocaleCodes('en', ['en-US'])).toEqual(['en'])
  })

  test('a trailing ! stops the walk right there, vue-i18n\'s own way of suppressing further fallback', () => {
    expect(getFallbackLocaleCodes(['de-DE!'], ['fr'])).toEqual(['de-DE'])
  })

  test('(#regression) a trailing ! on the source locale itself works the same way, and doesn\'t make it show up in its own fallback list', () => {
    expect(getFallbackLocaleCodes(false, ['de-DE!'])).toEqual([])
    expect(getFallbackLocaleCodes(['ja'], ['de-DE!'])).toEqual(['ja'])
  })

  test('a fallbackLocale map entry keyed on the exact locale being resolved diverts the walk before it ever reaches that locale\'s own base tag', () => {
    expect(getFallbackLocaleCodes({ 'en-US': ['ja'] }, ['en-US'])).toEqual(['ja'])
  })

  test('a map entry keyed on a base tag reached mid walk still lets the walk reach it first, then diverts from there', () => {
    expect(getFallbackLocaleCodes({ en: ['ja'] }, ['en-US'])).toEqual(['en', 'ja'])
  })

  test('a map entry that names nothing reached by the walk changes nothing', () => {
    expect(getFallbackLocaleCodes({ fr: ['ja'] }, ['en-US'])).toEqual(['en'])
  })

  test('default still applies after a walk that was never diverted', () => {
    // `ko` isn't a configured locale here, but it's named directly in `default`, so it's kept
    // regardless, the same way an explicit fallbackLocale entry always is
    expect(getFallbackLocaleCodes({ fr: ['ja'], default: ['ko'] }, ['en-US'])).toEqual(['en', 'ko'])
  })

  test('default still applies after a walk that was diverted, the diversion doesn\'t skip it', () => {
    expect(getFallbackLocaleCodes({ 'en-US': ['ja'], default: ['ko'] }, ['en-US'])).toEqual(['ja', 'ko'])
  })

  test('a diversion from a mid-walk tag on a multi level locale stops the walk there too, its own base tag is never reached', () => {
    expect(getFallbackLocaleCodes({ 'de-DE': ['ja'] }, ['de-DE-bavarian'])).toEqual(['de-DE', 'ja'])
  })

  test('(#regression) a diverted walk abandons every sibling still left in that block, and never reaches the locale\'s own base tag', () => {
    // the old implementation unioned base tags with whatever fallbackLocale contained, so it
    // would have returned something like ['en', 'de-DE', 'ko'] here: `en` because it never
    // noticed the map key intercepts en-US before its base tag, and `ko` because it never
    // noticed de-DE already redirected the walk away before ko got a turn
    expect(getFallbackLocaleCodes({ 'en-US': ['de-DE', 'ko'], 'de-DE': ['ja'] }, ['en-US'])).toEqual(['de-DE', 'ja'])
  })

  test('a fallbackLocale map with a cycle in it resolves instead of looping forever', () => {
    expect(getFallbackLocaleCodes({ en: ['fr'], fr: ['en'] }, ['en'])).toEqual(['fr'])
  })

  test('an explicit entry is kept even when it is not itself a configured locale, whether or not it is also reached implicitly', () => {
    expect(getFallbackLocaleCodes(['fr'], ['fr-CA'])).toEqual(['fr'])
  })

  test('a tag only reached implicitly still gets filtered against configured locales even when it descends from an explicit entry', () => {
    expect(getFallbackLocaleCodes({ default: ['xx-YY'] }, ['fr'])).toEqual(['xx-YY'])
  })

  test('merges and dedupes across multiple source locales, each keeping its own explicit or configured tags', () => {
    expect(getFallbackLocaleCodes({ default: ['ja'] }, ['de-DE', 'fr-CA'])).toEqual(['de', 'ja'])
  })

  test('an empty array on the exact locale suppresses its fallback entirely, including its own base tag', () => {
    expect(getFallbackLocaleCodes({ 'en-US': [] }, ['en-US'])).toEqual([])
  })

  test('(#regression) a ! on a redirect target stops that target from walking its own base tag, scoped to just that redirect', () => {
    // without the bang, redirecting de-DE-bavarian to de-DE doesn't stop de-DE from then trying
    // its own base tag de on its own, so de still gets pulled in
    expect(getFallbackLocaleCodes({ 'de-DE-bavarian': ['de-DE'] }, ['de-DE-bavarian'])).toEqual(['de-DE', 'de'])
    // the bang stops it there, de is never touched
    expect(getFallbackLocaleCodes({ 'de-DE-bavarian': ['de-DE!'] }, ['de-DE-bavarian'])).toEqual(['de-DE'])
  })

  test('that scoped suppression only applies to the redirect it\'s written on, de-DE visited on its own still falls back to de normally', () => {
    expect(getFallbackLocaleCodes({ 'de-DE-bavarian': ['de-DE!'] }, ['de-DE'])).toEqual(['de'])
  })

  test('a ! on the key side of a map entry is a dead entry, vue-i18n always strips it before checking the key', () => {
    expect(getFallbackLocaleCodes({ 'de-DE!': ['ja'] }, ['de-DE'])).toEqual(['de'])
  })
})

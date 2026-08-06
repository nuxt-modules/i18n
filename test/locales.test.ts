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
})

import { describe, expect, test } from 'vitest'
import { matchDomainLocale } from '../src/runtime/shared/domain'
import { normalizeDomainLocale } from '../src/utils'
import type { LocaleObject } from '../src/types'

const locales: LocaleObject[] = [
  { code: 'en', domain: 'en.example.com' },
  { code: 'fr', domain: 'https://fr.example.com' },
  { code: 'nl', domains: ['shared.example.com'], domainDefault: true },
  { code: 'de', domains: ['shared.example.com'] },
]

describe('matchDomainLocale', () => {
  test('matches locale by domain', () => {
    expect(matchDomainLocale(locales, 'en.example.com', '')).toBe('en')
  })

  test('ignores protocol in configured domain', () => {
    expect(matchDomainLocale(locales, 'fr.example.com', '')).toBe('fr')
  })

  test('resolves shared domain by path locale', () => {
    expect(matchDomainLocale(locales, 'shared.example.com', 'de')).toBe('de')
  })

  test('falls back to the domain default locale on shared domains', () => {
    expect(matchDomainLocale(locales, 'shared.example.com', '')).toBe('nl')
  })

  test('returns undefined for unknown host', () => {
    expect(matchDomainLocale(locales, 'unknown.example.com', '')).toBeUndefined()
  })
})

describe('normalizeDomainLocale', () => {
  test('normalizes `domain` to `domains`', () => {
    expect(normalizeDomainLocale({ code: 'en', domain: 'en.example.com' })).toMatchObject({
      domain: 'en.example.com',
      domains: ['en.example.com']
    })
  })

  test('normalizes `domainDefault` to `defaultForDomains`', () => {
    expect(normalizeDomainLocale({ code: 'en', domain: 'shared.example.com', domainDefault: true })).toMatchObject({
      domains: ['shared.example.com'],
      defaultForDomains: ['shared.example.com']
    })
  })

  test('normalizes `domainDefault` used with `domains`', () => {
    expect(
      normalizeDomainLocale({ code: 'en', domains: ['a.example.com', 'b.example.com'], domainDefault: true })
    ).toMatchObject({
      defaultForDomains: ['a.example.com', 'b.example.com']
    })
  })

  test('keeps multi-domain fields as-is', () => {
    const locale = { code: 'en', domains: ['a.example.com'], defaultForDomains: ['a.example.com'] }
    expect(normalizeDomainLocale(locale)).toEqual(locale)
  })

  test('does not add fields for locales without domains', () => {
    expect(normalizeDomainLocale({ code: 'en' })).toEqual({ code: 'en' })
    expect(normalizeDomainLocale({ code: 'en', domainDefault: true })).toEqual({ code: 'en', domainDefault: true })
  })
})

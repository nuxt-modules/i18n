import { describe, expect, test } from 'vitest'
import { matchDomainLocale } from '../src/runtime/shared/domain'
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

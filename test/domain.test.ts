import { describe, test, expect } from 'vitest'
import { matchDomainLocale } from '../src/runtime/shared/domain'
import type { LocaleObject } from '#internal-i18n-types'

const domainLocales: LocaleObject[] = [
  { code: 'en', domain: 'example.com' },
  { code: 'fr', domain: 'example.fr' },
  { code: 'de', domain: 'shared.example', domainDefault: true },
  { code: 'nl', domain: 'shared.example' },
]

const domainlessLocales: LocaleObject[] = [
  { code: 'de' },
  { code: 'en' },
  { code: 'es' },
  { code: 'uk' },
]

describe('matchDomainLocale', () => {
  test('matches a locale by its configured domain', () => {
    expect(matchDomainLocale(domainLocales, 'example.fr', '')).toBe('fr')
  })

  test('prefers the path locale when several locales share a host', () => {
    expect(matchDomainLocale(domainLocales, 'shared.example', 'nl')).toBe('nl')
  })

  test('falls back to the domain default when several locales share a host', () => {
    expect(matchDomainLocale(domainLocales, 'shared.example', '')).toBe('de')
  })

  test('returns undefined for an unknown host when domains are configured', () => {
    expect(matchDomainLocale(domainLocales, 'unknown.example', '')).toBeUndefined()
  })

  describe('single-host runtime mode (no locale declares a domain)', () => {
    test('resolves the path locale for prefixed paths', () => {
      expect(matchDomainLocale(domainlessLocales, 'preview-1234.example.dev', 'uk')).toBe('uk')
    })

    test('falls back to the runtime default locale for unprefixed paths', () => {
      expect(matchDomainLocale(domainlessLocales, 'preview-1234.example.dev', '', 'es')).toBe('es')
    })

    test('returns undefined without a runtime default', () => {
      expect(matchDomainLocale(domainlessLocales, 'preview-1234.example.dev', '')).toBeUndefined()
    })

    test('stays disabled when any locale declares a domain', () => {
      const mixed: LocaleObject[] = [{ code: 'en', domain: 'example.com' }, { code: 'fr' }]
      expect(matchDomainLocale(mixed, 'unmatched.example', '', 'fr')).toBeUndefined()
    })
  })
})

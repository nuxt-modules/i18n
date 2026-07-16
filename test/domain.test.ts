import { describe, expect, test } from 'vitest'
import { domainFromLocale, matchDomainLocale, withRuntimeDomain } from '../src/runtime/shared/domain'
import { createBaseUrlGetter } from '../src/runtime/context'
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

describe('domainFromLocale', () => {
  const url = { host: 'en.example.com', protocol: 'http:' }

  test('resolves the locale domain with the request protocol', () => {
    expect(domainFromLocale({}, url, 'en', locales)).toBe('http://en.example.com')
  })

  test('keeps the protocol of the configured domain', () => {
    expect(domainFromLocale({}, url, 'fr', locales)).toBe('https://fr.example.com')
  })

  test('(#2931) `domainLocales` runtime config overrides the configured domain', () => {
    expect(domainFromLocale({ en: { domain: 'en.staging.example.com' } }, url, 'en', locales)).toBe(
      'http://en.staging.example.com'
    )
  })

  test('multi-domain locales resolve to the current host', () => {
    expect(domainFromLocale({}, { host: 'shared.example.com', protocol: 'http:' }, 'nl', locales)).toBe(
      'http://shared.example.com'
    )
  })

  test('returns undefined without a matching domain', () => {
    expect(domainFromLocale({}, url, 'nl', locales)).toBeUndefined()
  })
})

describe('withRuntimeDomain', () => {
  test('(#3988) overrides the locale domain from runtime config', () => {
    expect(withRuntimeDomain(locales[0], { en: { domain: 'en.staging.example.com' } })).toMatchObject({
      code: 'en',
      domain: 'en.staging.example.com'
    })
  })

  test('returns the locale as-is without an override', () => {
    expect(withRuntimeDomain(locales[0], {})).toBe(locales[0])
    expect(withRuntimeDomain('en', { en: { domain: 'en.staging.example.com' } })).toBe('en')
  })
})

describe('createBaseUrlGetter', () => {
  const domains: Record<string, string> = { en: 'http://en.example.com', fr: 'http://fr.example.com' }
  const getBaseUrl = (overrides = {}) =>
    createBaseUrlGetter({
      baseUrl: 'http://localhost:3000',
      appBase: '/',
      domains: false,
      defaultLocale: 'en',
      getDomainFromLocale: locale => domains[locale],
      ...overrides
    })

  test('returns the configured `baseUrl`', () => {
    expect(getBaseUrl()()).toBe('http://localhost:3000')
  })

  test('domains: resolves the default locale domain', () => {
    expect(getBaseUrl({ domains: true })()).toBe('http://en.example.com')
  })

  test('domains: resolves the domain for the requested locale', () => {
    expect(getBaseUrl({ domains: true })('fr')).toBe('http://fr.example.com')
  })

  test('falls back to the default locale domain, then `baseUrl`', () => {
    expect(getBaseUrl({ domains: true })('nl')).toBe('http://en.example.com')
    expect(getBaseUrl({ domains: true, getDomainFromLocale: () => undefined })('nl')).toBe('http://localhost:3000')
  })

  test('(#3628, #3887) joins `app.baseURL` after the locale domain', () => {
    expect(getBaseUrl({ domains: true, appBase: '/base-path' })('fr')).toBe('http://fr.example.com/base-path')
    expect(getBaseUrl({ appBase: '/base-path' })()).toBe('http://localhost:3000/base-path')
  })

  test('function `baseUrl` is used as-is', () => {
    expect(getBaseUrl({ domains: true, baseUrl: () => 'http://fn.example.com' })()).toBe('http://fn.example.com')
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

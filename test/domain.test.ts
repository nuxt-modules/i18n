import { describe, expect, test } from 'vitest'
import {
  cookieSpansDomains,
  domainForHost,
  domainFromLocale,
  isLocaleOnHost,
  isLocaleServedOnHost,
  matchDomainLocale,
  normalizeDomain,
  withRuntimeDomain,
} from '../src/runtime/shared/domain'
import { getDefaultLocaleForDomain } from '../src/runtime/shared/locales'
import { createBaseUrlGetter } from '../src/runtime/context'
import { normalizeDomainLocale } from '../src/utils'
import { getNormalizedLocales } from './pages/utils'

// the runtime only ever sees build-normalized locales, resolve them the same way here
const locales = getNormalizedLocales([
  { code: 'en', domain: 'en.example.com' },
  { code: 'fr', domain: 'https://fr.example.com' },
  { code: 'nl', domains: ['shared.example.com'], domainDefault: true },
  { code: 'de', domains: ['shared.example.com'] },
  { code: 'es', domains: ['https://shared2.example.com'], defaultForDomains: ['https://shared2.example.com'] },
  { code: 'it', domains: ['shared2.example.com'] },
])

describe('normalizeDomain', () => {
  test('strips only a leading protocol, `host:port` is kept intact', () => {
    expect(normalizeDomain('https://www.example.com')).toBe('www.example.com')
    expect(normalizeDomain('localhost:3000')).toBe('localhost:3000')
    expect(normalizeDomain('http://127.0.0.1:7787')).toBe('127.0.0.1:7787')
    expect(normalizeDomain()).toBe('')
    // request hosts are always lowercase, a configured domain may not be
    expect(normalizeDomain('https://EN.Example.com')).toBe('en.example.com')
    expect(normalizeDomain('HTTPS://EN.Example.com')).toBe('en.example.com')
  })
})

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

  test('(#4064) ignores protocol in `defaultForDomains` on shared domains', () => {
    expect(matchDomainLocale(locales, 'shared2.example.com', '')).toBe('es')
  })

  test('returns undefined for unknown host', () => {
    expect(matchDomainLocale(locales, 'unknown.example.com', '')).toBeUndefined()
  })

  test('a shared domain claiming no default resolves its first locale', () => {
    const shared = getNormalizedLocales([
      { code: 'ja', domains: ['brands.example.com'] },
      { code: 'ko', domains: ['brands.example.com'] },
    ])
    expect(matchDomainLocale(shared, 'brands.example.com', '')).toBe('ja')
    expect(matchDomainLocale(shared, 'brands.example.com', 'ko')).toBe('ko')
  })
})

describe('cookieSpansDomains', () => {
  test('a cookie scope covering every domain spans, one excluding any domain does not', () => {
    const subdomains = getNormalizedLocales([
      { code: 'en', domain: 'en.example.com' },
      { code: 'fr', domains: ['fr.example.com:3000'] },
    ])
    expect(cookieSpansDomains(subdomains, '.example.com')).toBe(true)
    expect(cookieSpansDomains(subdomains, 'example.com')).toBe(true)
    expect(cookieSpansDomains(subdomains, '.fr.example.com')).toBe(false)
    // ccTLD siblings can never share a cookie scope
    const cctld = getNormalizedLocales([
      { code: 'en', domain: 'mysite.com' },
      { code: 'fr', domain: 'mysite.fr' },
    ])
    expect(cookieSpansDomains(cctld, '.mysite.com')).toBe(false)
  })
})

describe('isLocaleServedOnHost', () => {
  test('a restricted locale is served on its own domains', () => {
    expect(isLocaleServedOnHost(locales, 'shared.example.com', 'de')).toBe(true)
    expect(isLocaleServedOnHost(locales, 'fr.example.com', 'fr')).toBe(true)
  })

  test('a restricted locale is not served on another configured domain', () => {
    expect(isLocaleServedOnHost(locales, 'shared.example.com', 'en')).toBe(false)
    expect(isLocaleServedOnHost(locales, 'en.example.com', 'de')).toBe(false)
  })

  test('a locale without domains is served everywhere', () => {
    expect(isLocaleServedOnHost([...locales, ...getNormalizedLocales(['pl'])], 'en.example.com', 'pl')).toBe(true)
  })

  test('an unconfigured host is not restricted', () => {
    expect(isLocaleServedOnHost(locales, 'staging.example.com', 'en')).toBe(true)
    expect(isLocaleServedOnHost(locales, '127.0.0.1:3000', 'de')).toBe(true)
  })

  test('an unknown locale is not restricted', () => {
    expect(isLocaleServedOnHost(locales, 'en.example.com', 'xx')).toBe(true)
  })
})

describe('getDefaultLocaleForDomain', () => {
  test('matches by host', () => {
    expect(getDefaultLocaleForDomain('shared.example.com', locales)).toBe('nl')
  })

  test('(#4064) ignores protocol in `defaultForDomains`', () => {
    expect(getDefaultLocaleForDomain('shared2.example.com', locales)).toBe('es')
  })

  test('(#4064) resolves normalized `domain` + `domainDefault` locales per host', () => {
    const perDomainDefaults = getNormalizedLocales([
      { code: 'cs', domain: 'https://www.example.cz', domainDefault: true },
      { code: 'en', domain: 'https://www.example.com', domainDefault: true },
    ])
    expect(getDefaultLocaleForDomain('www.example.com', perDomainDefaults)).toBe('en')
    expect(getDefaultLocaleForDomain('www.example.cz', perDomainDefaults)).toBe('cs')
  })

  test('returns undefined for unknown host', () => {
    expect(getDefaultLocaleForDomain('unknown.example.com', locales)).toBeUndefined()
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

  test('(#4064) multi-domain locales match by host and keep the configured protocol', () => {
    expect(domainFromLocale({}, { host: 'shared2.example.com', protocol: 'http:' }, 'es', locales)).toBe(
      'https://shared2.example.com'
    )
  })

  test('a locale served on none of the current host resolves to the domain it belongs to', () => {
    expect(domainFromLocale({}, url, 'nl', locales)).toBe('http://shared.example.com')
    // the domain the locale is the default for wins over the rest of its `domains`
    const multi = [
      ...locales,
      ...getNormalizedLocales([{ code: 'pt', domains: ['a.example.com', 'b.example.com'], defaultForDomains: ['b.example.com'] }]),
    ]
    expect(domainFromLocale({}, url, 'pt', multi)).toBe('http://b.example.com')
  })

  test('returns undefined for a locale without domains', () => {
    expect(domainFromLocale({}, url, 'pl', [...locales, ...getNormalizedLocales(['pl'])])).toBeUndefined()
  })

  test('a host matching no configured domain resolves no domain, so URLs stay relative', () => {
    // otherwise `nuxt dev` and staging would link and redirect to the configured domains
    expect(domainFromLocale({}, { host: 'localhost:3000', protocol: 'http:' }, 'nl', locales)).toBeUndefined()
  })
})

describe('domainForHost', () => {
  test('resolves the current host with the request protocol', () => {
    expect(domainForHost({}, { host: 'en.example.com', protocol: 'http:' }, locales)).toBe('http://en.example.com')
  })

  test('keeps the protocol of the configured domain', () => {
    expect(domainForHost({}, { host: 'fr.example.com', protocol: 'http:' }, locales)).toBe('https://fr.example.com')
  })

  test('matches the scalar `domain` of a locale that also configures `domains`', () => {
    // `normalizeDomainLocale` only folds `domain` into `domains` when `domains` is empty
    const both = getNormalizedLocales([
      { code: 'en', domain: 'en.example.com', domains: ['shared.example.com'], defaultForDomains: ['shared.example.com'] },
    ])
    expect(domainForHost({}, { host: 'en.example.com', protocol: 'http:' }, both)).toBe('http://en.example.com')
  })

  test('a host shared by several locales resolves once, the configured protocol wins over order', () => {
    expect(domainForHost({}, { host: 'shared.example.com', protocol: 'http:' }, locales)).toBe(
      'http://shared.example.com'
    )
    // `es` configures it with a protocol, `it` without - the result cannot depend on which comes first
    expect(domainForHost({}, { host: 'shared2.example.com', protocol: 'http:' }, locales)).toBe(
      'https://shared2.example.com'
    )
    expect(domainForHost({}, { host: 'shared2.example.com', protocol: 'http:' }, [...locales].reverse())).toBe(
      'https://shared2.example.com'
    )
  })

  test('two locales configuring the same host with different protocols keep the first', () => {
    // nothing disambiguates this, the result at least does not depend on which locale is asked
    const conflicting = getNormalizedLocales([
      { code: 'en', domains: ['https://shared.example.com'] },
      { code: 'fr', domains: ['http://shared.example.com'] },
    ])
    const url = { host: 'shared.example.com', protocol: 'http:' }

    expect(domainForHost({}, url, conflicting)).toBe('https://shared.example.com')
    expect(domainForHost({}, url, [...conflicting].reverse())).toBe('http://shared.example.com')
  })

  test('a host serving locales but no default resolves to itself, not to `defaultLocale`', () => {
    const brands = getNormalizedLocales([
      { code: 'en', domains: ['brand-a.example.com'], defaultForDomains: ['brand-a.example.com'] },
      { code: 'ja', domains: ['brand-c.example.com'] },
    ])
    const url = { host: 'brand-c.example.com', protocol: 'http:' }

    expect(domainForHost({}, url, brands)).toBe('http://brand-c.example.com')
    // the locale lookup resolves where `en` is served, which is what made the redirect leave the host
    expect(domainFromLocale({}, url, 'en', brands)).toBe('http://brand-a.example.com')
  })

  test('a host matching no configured domain resolves no domain, so URLs stay relative', () => {
    expect(domainForHost({}, { host: 'localhost:3000', protocol: 'http:' }, locales)).toBeUndefined()
  })

  test('(#3988) resolves a host the locale was moved to by `domainLocales`', () => {
    const url = { host: 'en.staging.example.com', protocol: 'http:' }

    expect(domainForHost({ en: { domain: 'en.staging.example.com' } }, url, locales)).toBe(
      'http://en.staging.example.com'
    )
    expect(domainForHost({}, url, locales)).toBeUndefined()
  })
})

describe('withRuntimeDomain', () => {
  test('(#3988) overrides the locale domain from runtime config', () => {
    expect(withRuntimeDomain(locales[0], { en: { domain: 'en.staging.example.com' } })).toMatchObject({
      code: 'en',
      domain: 'en.staging.example.com'
    })
  })

  test('an overridden locale stops matching the host it was configured with', () => {
    const configured = normalizeDomainLocale({ code: 'en', domain: 'en.example.com', domainDefault: true })
    const patched = withRuntimeDomain(configured, { en: { domain: 'en.staging.example.com' } })

    expect(isLocaleOnHost(patched, 'en.staging.example.com')).toBe(true)
    expect(isLocaleOnHost(patched, 'en.example.com')).toBe(false)
    // the locale is still the default, for the domain it was moved to
    expect(getDefaultLocaleForDomain('en.staging.example.com', [patched])).toBe('en')
  })

  test('returns the locale as-is without an override', () => {
    expect(withRuntimeDomain(locales[0], {})).toBe(locales[0])
    expect(withRuntimeDomain('en', { en: { domain: 'en.staging.example.com' } })).toBe('en')
  })

  test('an entry matching a configured domain is not an override, the other domains survive', () => {
    // `domainLocales` is seeded from the scalar `domain` for every locale, so it is populated
    // without the user setting anything - see `module.ts`
    const configured = normalizeDomainLocale({
      code: 'en',
      domain: 'en.example.com',
      domains: ['en.example.com', 'www.example.com'],
    })
    expect(withRuntimeDomain(configured, { en: { domain: 'en.example.com' } })).toBe(configured)
  })

  test('a locale that is not configured has no domains to override', () => {
    // `composer.localeProperties` falls back to a bare locale when the current one is unknown
    const unknown = { code: 'en', domains: [], defaultForDomains: [] }
    expect(withRuntimeDomain(unknown, { en: { domain: 'en.staging.example.com' } })).toMatchObject({
      domains: ['en.staging.example.com'],
      defaultForDomains: []
    })
  })
})

describe('createBaseUrlGetter', () => {
  const domains: Record<string, string> = { en: 'http://en.example.com', fr: 'http://fr.example.com' }
  const getBaseUrl = (overrides = {}) =>
    createBaseUrlGetter({
      baseUrl: 'http://localhost:3000',
      appBase: '/',
      domains: false,
      getDomainForHost: () => 'http://en.example.com',
      getDomainFromLocale: locale => domains[locale],
      ...overrides
    })

  test('returns the configured `baseUrl`', () => {
    expect(getBaseUrl()()).toBe('http://localhost:3000')
  })

  test('domains: resolves the current host domain', () => {
    expect(getBaseUrl({ domains: true })()).toBe('http://en.example.com')
  })

  test('domains: resolves the domain for the requested locale', () => {
    expect(getBaseUrl({ domains: true })('fr')).toBe('http://fr.example.com')
  })

  test('falls back to the current host domain, then `baseUrl`', () => {
    expect(getBaseUrl({ domains: true })('nl')).toBe('http://en.example.com')
    expect(getBaseUrl({ domains: true, getDomainForHost: () => undefined })('nl')).toBe('http://localhost:3000')
  })

  test('a host serving no default locale keeps its own origin', () => {
    // resolving the base from `defaultLocale` sent it to that locale's domain instead
    expect(getBaseUrl({ domains: true, getDomainForHost: () => 'http://shared.example.com' })()).toBe(
      'http://shared.example.com'
    )
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

  test('both fields are always resolved, a locale without domains gets the empty form', () => {
    expect(normalizeDomainLocale({ code: 'en' })).toEqual({ code: 'en', domains: [], defaultForDomains: [] })
  })

  test('`domainDefault` without a domain has nothing to be the default for', () => {
    expect(normalizeDomainLocale({ code: 'en', domainDefault: true })).toMatchObject({ defaultForDomains: [] })
  })
})

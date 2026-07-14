import { describe, expect, test, vi } from 'vitest'
import { localeHead } from '../src/runtime/kit/head'

import type { HeadContext } from '../src/runtime/kit/head'
import type { HeadLocale } from '../src/runtime/kit/types'

const locales: HeadLocale[] = [
  { code: 'en', language: 'en-US' },
  { code: 'nl', language: 'nl-NL' },
]

function createHeadContext(overrides: Partial<HeadContext> = {}): HeadContext {
  const route = { path: '/about', name: 'about___en', query: {}, meta: {} }
  return {
    key: 'id',
    strictSeo: false,
    dir: true,
    lang: true,
    seo: true,
    baseUrl: 'https://example.com',
    locales,
    defaultLocale: 'en',
    hreflangLinks: true,
    strictCanonicals: true,
    canonicalQueries: [],
    getCurrentLanguage: () => 'en-US',
    getCurrentDirection: () => 'ltr',
    getRouteBaseName: () => 'about',
    getLocaleRoute: r => ({ ...route, ...r, path: '/about' }),
    getCurrentRoute: () => route,
    getRouteWithoutQuery: () => route,
    getLocalizedRoute: locale => (locale === 'en' ? '/about' : `/${locale}/about`),
    ...overrides,
  } as HeadContext
}

describe('html attributes', () => {
  test('sets dir and lang from current locale', () => {
    const head = localeHead(createHeadContext())
    expect(head.htmlAttrs).toEqual({ dir: 'ltr', lang: 'en-US' })
  })

  test('omits disabled attributes', () => {
    const head = localeHead(createHeadContext({ dir: false, lang: false }))
    expect(head.htmlAttrs).toEqual({})
  })
})

describe('hreflang links', () => {
  test('generates alternate links with bare-language catchalls and x-default first', () => {
    const head = localeHead(createHeadContext())
    expect(head.link.map(x => [x.hreflang, x.href])).toEqual([
      ['x-default', 'https://example.com/about'],
      ['en', 'https://example.com/about'],
      ['en-US', 'https://example.com/about'],
      ['nl', 'https://example.com/nl/about'],
      ['nl-NL', 'https://example.com/nl/about'],
      [undefined, 'https://example.com/about'], // canonical
    ])
  })

  test('catchall locale takes over its language group', () => {
    const head = localeHead(
      createHeadContext({
        locales: [
          { code: 'en', language: 'en-US' },
          { code: 'en-GB', language: 'en-GB', isCatchallLocale: true },
        ],
        getLocalizedRoute: locale => `/${locale}/about`,
      }),
    )
    const bareEnglish = head.link.find(x => x.hreflang === 'en')
    expect(bareEnglish!.href).toBe('https://example.com/en-GB/about')
  })

  test('skips locales without a language tag and warns', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const head = localeHead(createHeadContext({ locales: [{ code: 'en' }] }))
    expect(head.link.filter(x => x.rel === 'alternate')).toEqual([])
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  test('uses localized route as-is when it has a protocol', () => {
    const head = localeHead(
      createHeadContext({ getLocalizedRoute: locale => `https://${locale}.example.com/about` }),
    )
    expect(head.link.find(x => x.hreflang === 'nl')!.href).toBe('https://nl.example.com/about')
  })

  test('disabled seo or hreflang links produce no links', () => {
    expect(localeHead(createHeadContext({ seo: false })).link).toEqual([])
    const head = localeHead(createHeadContext({ hreflangLinks: false }))
    expect(head.link.map(x => x.rel)).toEqual(['canonical'])
  })
})

describe('canonical link', () => {
  test('filters query params using canonicalQueries', () => {
    const route = { path: '/about', name: 'about___en', query: { page: '2', q: 'x' }, meta: {} }
    const head = localeHead(
      createHeadContext({
        canonicalQueries: ['page'],
        strictCanonicals: true,
        getCurrentRoute: () => route,
        getLocaleRoute: r => ({ ...route, ...r, path: '/about' }),
      } as Partial<HeadContext>),
    )
    const canonical = head.link.find(x => x.rel === 'canonical')
    expect(canonical!.href).toBe('https://example.com/about?page=2')
  })

  test('omits canonical when the route cannot be resolved', () => {
    const head = localeHead(createHeadContext({ getLocaleRoute: () => undefined }))
    expect(head.link.find(x => x.rel === 'canonical')).toBeUndefined()
    expect(head.meta.find(x => x.property === 'og:url')).toBeUndefined()
  })
})

describe('og meta', () => {
  test('generates og:url, og:locale and alternates in `language_TERRITORY` format', () => {
    const head = localeHead(createHeadContext())
    expect(head.meta).toEqual([
      { id: 'i18n-og-url', property: 'og:url', content: 'https://example.com/about' },
      { id: 'i18n-og', property: 'og:locale', content: 'en_US' },
      { id: 'i18n-og-alt-nl-NL', property: 'og:locale:alternate', content: 'nl_NL' },
    ])
  })
})

describe('strict seo mode', () => {
  test('omits tag identity keys', () => {
    const head = localeHead(createHeadContext({ strictSeo: true }))
    for (const tag of [...head.link, ...head.meta]) {
      expect(tag.id).toBeUndefined()
      expect(tag.key).toBeUndefined()
    }
  })

  test('limits og alternates to locales with an alternate link', () => {
    const head = localeHead(
      createHeadContext({
        strictSeo: true,
        locales: [...locales, { code: 'fr', language: 'fr-FR' }],
        // no localized variant for fr
        getLocalizedRoute: locale => (locale === 'fr' ? '' : `/${locale}/about`),
      }),
    )
    expect(head.meta.filter(x => x.property === 'og:locale:alternate')).toEqual([
      { property: 'og:locale:alternate', content: 'nl_NL' },
    ])
  })
})

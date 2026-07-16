import { beforeEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutingContext } from '../src/runtime/routing/context'
import { setupMultiDomainLocales } from '../src/runtime/routing/domain'
import { _useLocaleHead, _useSetI18nParams, localeHead } from '../src/runtime/routing/head'
import { switchLocalePath } from '../src/runtime/routing/routing'
import { headEntries } from './mocks/imports'

import type { Router } from 'vue-router'
import type { ComposableContext } from '../src/runtime/composable-context'
import type { I18nHeadMetaInfo } from '../src/runtime/kit/head'

const locales = [
  { code: 'en', language: 'en' },
  { code: 'fr', language: 'fr' },
  { code: 'ja', language: 'ja-JP' },
  { code: 'nl', language: 'nl-NL' },
]

const component = {}
const routes = [
  { name: 'index', path: '/' },
  { name: 'products-slug', path: '/products/:slug()' },
].flatMap(r =>
  locales.map(l => ({
    name: `${r.name}___${l.code}`,
    path: l.code === 'en' ? r.path : `/${l.code}${r.path === '/' ? '' : r.path}`,
    component,
  })),
)

function createTestContext(initialLocale = 'en', strictSeo = false, domains = false) {
  let locale = initialLocale
  const router = createRouter({ history: createMemoryHistory(), routes })
  const head = { patches: [] as I18nHeadMetaInfo[], patch(val: I18nHeadMetaInfo) { this.patches.push(val) } }
  const domainLocales = locales.map(l => ({
    ...l,
    domain: `${l.code}.example.com`,
    defaultForDomains: [`${l.code}.example.com`],
  }))
  if (domains) {
    // rebuild the route table for the current host, mirrors the runtime plugin
    setupMultiDomainLocales(initialLocale, 'prefix_except_default', router)
  }
  const ctx = {
    ...createRoutingContext({
      router,
      defaultLocale: 'en',
      strategy: 'prefix_except_default',
      routing: true,
      domains,
      trailingSlash: false,
      strictSeo,
      compactRoutes: false,
      getLocale: () => locale,
      getLocales: () => (domains ? domainLocales : locales),
      // the default (no-locale) base URL under domains is the default locale's domain
      getBaseUrl: l => (domains ? `https://${l ?? 'en'}.example.com` : 'https://example.com'),
      getHost: () => (domains ? `${locale}.example.com` : 'example.com'),
    }),
    _head: undefined,
    head,
    strictSeo,
    metaState: { htmlAttrs: {}, meta: [], link: [] },
    seoSettings: { dir: true, lang: true, seo: true },
    localePathPayload: {},
    routingOptions: { defaultLocale: 'en', strictCanonicals: true, hreflangLinks: true, domains },
  } as unknown as ComposableContext
  return { router, ctx, head, setLocale: (l: string) => (locale = l) }
}

function setDynamicParams(router: Router, params: Record<string, Record<string, string>>) {
  router.currentRoute.value.meta.nuxtI18nInternal = params
}

const chairParams = { fr: { slug: 'french-chair' }, ja: { slug: 'japanese-chair' }, nl: { slug: 'grote-stoel' } }

beforeEach(() => {
  headEntries.length = 0
})

describe('localeHead', () => {
  test('generates head for localized dynamic route', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')
    setDynamicParams(router, chairParams)

    const head = localeHead(ctx, {})
    expect(head.htmlAttrs).toEqual({ dir: 'ltr', lang: 'en' })
    expect(head.link.map(x => [x.hreflang ?? x.rel, x.href])).toEqual([
      ['x-default', 'https://example.com/products/big-chair'],
      ['en', 'https://example.com/products/big-chair'],
      ['fr', 'https://example.com/fr/products/french-chair'],
      ['ja', 'https://example.com/ja/products/japanese-chair'],
      ['ja-JP', 'https://example.com/ja/products/japanese-chair'],
      ['nl', 'https://example.com/nl/products/grote-stoel'],
      ['nl-NL', 'https://example.com/nl/products/grote-stoel'],
      ['canonical', 'https://example.com/products/big-chair'],
    ])
    expect(head.meta.map(x => [x.property, x.content])).toEqual([
      ['og:url', 'https://example.com/products/big-chair'],
      ['og:locale', 'en'],
      ['og:locale:alternate', 'fr'],
      ['og:locale:alternate', 'ja_JP'],
      ['og:locale:alternate', 'nl_NL'],
    ])
  })

  test('keeps canonical queries listed in seo options for canonical and alternate links', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair?page=2&foo=bar')
    setDynamicParams(router, chairParams)

    const head = localeHead(ctx, { seo: { canonicalQueries: ['page'] } })
    expect(head.link.find(x => x.rel === 'canonical')!.href).toBe('https://example.com/products/big-chair?page=2')
    expect(head.link.find(x => x.hreflang === 'fr')!.href).toBe('https://example.com/fr/products/french-chair?page=2')

    await router.push('/products/big-chair?foo=bar')
    const noMatch = localeHead(ctx, { seo: { canonicalQueries: ['page'] } })
    expect(noMatch.link.find(x => x.rel === 'canonical')!.href).toBe('https://example.com/products/big-chair')
  })
})

describe('localeHead with domains', () => {
  test('(#2595) alternate and canonical links are absolute in each locale domain', async () => {
    const { router, ctx } = createTestContext('fr', false, true)
    await router.push('/')

    const head = localeHead(ctx, {})
    expect(head.link.map(x => [x.hreflang ?? x.rel, x.href])).toEqual([
      ['x-default', 'https://en.example.com'],
      ['en', 'https://en.example.com'],
      ['fr', 'https://fr.example.com'],
      ['ja', 'https://ja.example.com'],
      ['ja-JP', 'https://ja.example.com'],
      ['nl', 'https://nl.example.com'],
      ['nl-NL', 'https://nl.example.com'],
      // the canonical self-references the current locale domain
      ['canonical', 'https://fr.example.com'],
    ])
    expect(head.meta.map(x => [x.property, x.content])).toEqual([
      ['og:url', 'https://fr.example.com'],
      ['og:locale', 'fr'],
      ['og:locale:alternate', 'en'],
      ['og:locale:alternate', 'ja_JP'],
      ['og:locale:alternate', 'nl_NL'],
    ])
  })
})

describe('switchLocalePath', () => {
  test('resolves localized dynamic params', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')
    setDynamicParams(router, chairParams)

    expect(switchLocalePath(ctx, 'nl')).toBe('/nl/products/grote-stoel')
    expect(switchLocalePath(ctx, 'en')).toBe('/products/big-chair')
  })

  test('falls back to current params without localized params', async () => {
    const { router, ctx, setLocale } = createTestContext()
    await router.push('/nl/products/rode-mok')
    setLocale('nl')
    setDynamicParams(router, { en: { slug: 'red-mug' }, fr: { slug: 'french-mug' } })

    expect(switchLocalePath(ctx, 'en')).toBe('/products/red-mug')
    expect(switchLocalePath(ctx, 'ja')).toBe('/ja/products/rode-mok')
  })
})

describe('strict seo mode', () => {
  test('disables locales without localized dynamic params', async () => {
    const { router, ctx, setLocale } = createTestContext('en', true)
    await router.push('/nl/products/rode-mok')
    setLocale('nl')
    // no ja params - route should be treated as unavailable in ja
    setDynamicParams(router, { en: { slug: 'red-mug' }, fr: { slug: 'french-mug' }, nl: { slug: 'rode-mok' } })

    expect(switchLocalePath(ctx, 'ja')).toBe('')

    const head = localeHead(ctx, {})
    expect(head.htmlAttrs.lang).toBe('nl-NL')
    expect(head.link.map(x => [x.hreflang ?? x.rel, x.href])).toEqual([
      ['x-default', 'https://example.com/products/red-mug'],
      ['en', 'https://example.com/products/red-mug'],
      ['fr', 'https://example.com/fr/products/french-mug'],
      ['nl', 'https://example.com/nl/products/rode-mok'],
      ['nl-NL', 'https://example.com/nl/products/rode-mok'],
      ['canonical', 'https://example.com/nl/products/rode-mok'],
    ])
    // og alternates are limited to locales with an alternate link
    expect(head.meta.map(x => [x.property, x.content])).toEqual([
      ['og:url', 'https://example.com/nl/products/rode-mok'],
      ['og:locale', 'nl_NL'],
      ['og:locale:alternate', 'en'],
      ['og:locale:alternate', 'fr'],
    ])
  })

  test('omits tag identity keys', async () => {
    const { router, ctx } = createTestContext('en', true)
    await router.push('/products/big-chair')
    setDynamicParams(router, chairParams)

    const head = localeHead(ctx, {})
    for (const tag of [...head.link, ...head.meta]) {
      expect(tag.id).toBeUndefined()
      expect(tag.key).toBeUndefined()
    }
  })
})

describe('_useLocaleHead', () => {
  test('updates on navigation', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')
    setDynamicParams(router, chairParams)

    const metaObject = _useLocaleHead(ctx, { dir: true, lang: true, seo: true })
    expect(metaObject.value.link.find(x => x.rel === 'canonical')!.href).toBe('https://example.com/products/big-chair')

    await router.push('/')
    await nextTick()
    expect(metaObject.value.link.find(x => x.rel === 'canonical')!.href).toBe('https://example.com')
  })

  test('patches shared head state on updates in strict seo mode', async () => {
    const { router, ctx, head } = createTestContext('en', true)
    await router.push('/')

    const metaObject = _useLocaleHead(ctx, { dir: true, lang: true, seo: true })
    expect(head.patches).toEqual([metaObject.value])

    await router.push('/products/big-chair')
    await nextTick()
    expect(head.patches).toHaveLength(2)
  })
})

describe('_useSetI18nParams', () => {
  test('setter localizes switchLocalePath and patches head', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')

    // without dynamic params non-default locales resolve with the current slug
    expect(switchLocalePath(ctx, 'nl')).toBe('/nl/products/big-chair')

    const setI18nParams = _useSetI18nParams(ctx)
    setI18nParams(chairParams)

    expect(switchLocalePath(ctx, 'nl')).toBe('/nl/products/grote-stoel')
    const patched = headEntries[0]!.patches.at(-1) as I18nHeadMetaInfo
    expect(patched.link.find(x => x.hreflang === 'nl')!.href).toBe('https://example.com/nl/products/grote-stoel')
  })

  test('restores dynamic params after navigation', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')

    const setI18nParams = _useSetI18nParams(ctx)
    setI18nParams(chairParams)

    // navigation resets route meta, the composable re-applies the params
    await router.push('/')
    await nextTick()
    expect(router.currentRoute.value.meta.nuxtI18nInternal).toEqual(chairParams)
  })

  test('seo attributes override global canonicalQueries in strict seo mode', async () => {
    const { router, ctx, head } = createTestContext('en', true)
    ctx.seoSettings.seo = { canonicalQueries: ['page'] }
    await router.push('/products/big-chair?page=2&canonical=1')

    const setI18nParams = _useSetI18nParams(ctx, { canonicalQueries: ['canonical'] })
    setI18nParams(chairParams)

    const patched = head.patches.at(-1)!
    expect(patched.link.find(x => x.rel === 'canonical')!.href).toBe(
      'https://example.com/products/big-chair?canonical=1',
    )
  })
})

import { beforeEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutingContext } from '../src/runtime/routing/context'
import { setupMultiDomainLocales } from '../src/runtime/routing/domain'
import { _useLocaleHead, _useSetI18nParams, localeHead, missesClusterFallback } from '../src/runtime/routing/head'
import { switchLocalePath } from '../src/runtime/routing/routing'
import { headEntries } from './mocks/imports'
import { resolveDefaultLocale } from '../src/runtime/shared/locales'
import { createTestBaseUrls, getNormalizedLocales } from './pages/utils'

import type { Router } from 'vue-router'
import type { ComposableContext } from '../src/runtime/composable-context'
import type { I18nHeadMetaInfo } from '../src/runtime/kit/head'

const locales = getNormalizedLocales([
  { code: 'en', language: 'en' },
  { code: 'fr', language: 'fr' },
  { code: 'ja', language: 'ja-JP' },
  { code: 'nl', language: 'nl-NL' },
])

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

// one cluster of two hosts sharing every locale, with per-host defaults (`multiDomainLocales`)
const clusterLocales = getNormalizedLocales([
  { code: 'en', language: 'en', domains: ['example.nl', 'example.be'] },
  { code: 'nl', language: 'nl-NL', domains: ['example.nl', 'example.be'], defaultForDomains: ['example.nl'] },
  { code: 'fr', language: 'fr', domains: ['example.nl', 'example.be'], defaultForDomains: ['example.be'] },
])

// mirrors the build output: every locale prefixed, `___default` variants for domain defaults
const clusterRoutesFor = (cluster: typeof clusterLocales) => [
  ...cluster.map(l => ({ name: `index___${l.code}`, path: `/${l.code}`, component })),
  ...cluster
    .filter(l => l.defaultForDomains.length)
    .map(l => ({ name: `index___${l.code}___default`, path: '/', component })),
]

type TestContextOptions = {
  strictSeo?: boolean
  /** `true` gives every locale its own domain, an object selects the shared-domain cluster */
  domains?: boolean | { host: string, locales?: typeof clusterLocales }
  defaultLocale?: string
}

function createTestContext(initialLocale = 'en', opts: TestContextOptions = {}) {
  const { strictSeo = false, domains = false, defaultLocale: configuredDefault = 'en' } = opts
  let locale = initialLocale
  const cluster = typeof domains === 'object' ? (domains.locales ?? clusterLocales) : undefined
  const router = createRouter({
    history: createMemoryHistory(),
    routes: cluster ? clusterRoutesFor(cluster) : routes,
  })
  const head = { patches: [] as I18nHeadMetaInfo[], patch(val: I18nHeadMetaInfo) { this.patches.push(val) } }
  const domainLocales = getNormalizedLocales(
    locales.map(l => ({ ...l, domain: `${l.code}.example.com`, defaultForDomains: [`${l.code}.example.com`] })),
  )
  const testLocales = cluster ?? (domains ? domainLocales : locales)
  const host = typeof domains === 'object'
    ? domains.host
    : domains ? `${initialLocale}.example.com` : 'example.com'
  // resolved the way the runtime plugin does, rather than supplied
  const hostDefault = resolveDefaultLocale(host, configuredDefault, testLocales)
  if (domains) {
    // rebuild the route table for the current host, mirrors the runtime plugin
    setupMultiDomainLocales(hostDefault, 'prefix_except_default', router)
  }
  const ctx = {
    ...createRoutingContext({
      router,
      defaultLocale: hostDefault,
      configuredDefaultLocale: configuredDefault || '',
      strategy: 'prefix_except_default',
      routing: true,
      domains: !!domains,
      trailingSlash: false,
      strictSeo,
      compactRoutes: false,
      getLocale: () => locale,
      getLocales: () => testLocales,
      ...createTestBaseUrls({
        locales: testLocales,
        host,
        baseUrl: domains ? undefined : 'https://example.com',
        domains: !!domains,
        defaultLocale: configuredDefault,
      }),
      getHost: () => host,
    }),
    _head: undefined,
    head,
    strictSeo,
    metaState: { htmlAttrs: {}, meta: [], link: [] },
    seoSettings: { dir: true, lang: true, seo: true },
    localePathPayload: {},
    routingOptions: {
      // `createComposableContext` feeds `x-default` the configured value, not the host's default
      defaultLocale: configuredDefault || '',
      strictCanonicals: true,
      hreflangLinks: true,
      domains: !!domains,
    },
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
    const { router, ctx } = createTestContext('fr', { domains: true })
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

  test('every domain annotates the same `x-default`', async () => {
    for (const host of ['en', 'fr', 'nl']) {
      const { router, ctx } = createTestContext(host, { domains: true })
      await router.push('/')

      const xDefault = localeHead(ctx, {}).link.find(x => x.hreflang === 'x-default')
      expect(xDefault?.href).toBe('https://en.example.com')
    }
  })

  test('a missing cluster fallback is only worth reporting where alternates are emitted', () => {
    const seo = { dir: true, lang: true, seo: true }
    const withDomains = (configuredDefault: string) => createTestContext('fr', { domains: true, defaultLocale: configuredDefault }).ctx

    expect(missesClusterFallback(withDomains(''), seo)).toBe(true)
    // `defaultLocale` names the fallback
    expect(missesClusterFallback(withDomains('en'), seo)).toBe(false)
    // no alternate links to annotate
    expect(missesClusterFallback(withDomains(''), { ...seo, seo: false })).toBe(false)
    // a single domain cluster resolves `x-default` from the routing default as before
    expect(missesClusterFallback(createTestContext('fr', { defaultLocale: '' }).ctx, seo)).toBe(false)
  })

  test('no configured `defaultLocale` annotates no fallback, rather than one per domain', async () => {
    // the domain default is host-resolved and would disagree across the cluster, `prepareOptions`
    // warns instead - a locale has no way to claim the cluster fallback on its own
    const { router, ctx } = createTestContext('fr', { domains: true, defaultLocale: '' })
    await router.push('/')

    const links = localeHead(ctx, {}).link
    expect(links.filter(x => x.hreflang === 'x-default')).toEqual([])
    expect(links.map(x => x.hreflang ?? x.rel)).toContain('fr')
  })
})

describe('localeHead with locales served on several domains', () => {
  const clusterHosts = [
    ['example.nl', 'nl'],
    ['example.be', 'fr'],
  ] as const

  test('every host emits the same alternate links, shaped for each locale`s canonical domain', async () => {
    const alternates = []
    for (const [host, currentLocale] of clusterHosts) {
      const { router, ctx } = createTestContext(currentLocale, { domains: { host } })
      await router.push('/')
      alternates.push(localeHead(ctx, {}).link.filter(x => x.rel === 'alternate').map(x => [x.hreflang, x.href]))
    }

    // `nl` and `fr` resolve to the domain they are the default for (unprefixed there), `en` is
    // no host's default and resolves prefixed to its first domain - including `x-default`
    expect(alternates[0]).toEqual([
      ['x-default', 'https://example.nl/en'],
      ['en', 'https://example.nl/en'],
      ['nl', 'https://example.nl'],
      ['nl-NL', 'https://example.nl'],
      ['fr', 'https://example.be'],
    ])
    expect(alternates[1]).toEqual(alternates[0])
  })

  test('(#2595) the canonical keeps self-referencing the host serving the locale', async () => {
    for (const [host, currentLocale] of clusterHosts) {
      const { router, ctx } = createTestContext(currentLocale, { domains: { host } })
      await router.push('/')

      expect(localeHead(ctx, {}).link.find(x => x.rel === 'canonical')!.href).toBe(`https://${host}`)
    }
  })

  test('a page served off its locale`s canonical domain canonicalises to it', async () => {
    // `example.be` serves `nl` too, but the cluster advertises `nl` on `example.nl` - the duplicate
    // has to point there instead of claiming itself, or it competes with the URL it is a copy of
    const { router, ctx } = createTestContext('nl', { domains: { host: 'example.be' } })
    await router.push('/nl')

    const head = localeHead(ctx, {})
    const canonical = head.link.find(x => x.rel === 'canonical')!.href
    expect(canonical).toBe('https://example.nl')
    expect(head.meta.find(x => x.property === 'og:url')!.content).toBe('https://example.nl')
    // the canonical is a member of the set emitted alongside it
    expect(head.link.filter(x => x.rel === 'alternate').map(x => x.href)).toContain(canonical)
  })

  test('navigation links stay on the current host for the locales it serves', async () => {
    const { router, ctx } = createTestContext('nl', { domains: { host: 'example.nl' } })
    await router.push('/')

    expect(switchLocalePath(ctx, 'fr')).toBe('/fr')
    expect(switchLocalePath(ctx, 'en')).toBe('/en')
  })

  test('a locale unprefixed on its canonical domain only through `defaultLocale` is not linked prefixed', async () => {
    // `nl` claims no `defaultForDomains`, so example.nl serves it unprefixed by falling back to the
    // configured `defaultLocale` - annotating `example.nl/nl` would name a route that host never got
    const locales = getNormalizedLocales([
      { code: 'nl', language: 'nl-NL', domains: ['example.nl', 'example.be'] },
      { code: 'fr', language: 'fr', domains: ['example.nl', 'example.be'], defaultForDomains: ['example.be'] },
    ])
    const { router, ctx } = createTestContext('fr', { domains: { host: 'example.be', locales }, defaultLocale: 'nl' })
    await router.push('/')

    const links = localeHead(ctx, {}).link.filter(x => x.rel === 'alternate').map(x => [x.hreflang, x.href])
    expect(links).toEqual([
      ['x-default', 'https://example.nl'],
      ['nl', 'https://example.nl'],
      ['nl-NL', 'https://example.nl'],
      ['fr', 'https://example.be'],
    ])
  })

  test('a locale served on every domain is annotated on the one serving `defaultLocale`', async () => {
    // it has no domain of its own, and annotating the answering host would give the cluster a
    // different URL for this one locale from each domain
    const withPlain = [...clusterLocales, ...getNormalizedLocales([{ code: 'de', language: 'de' }])]
    const hrefs = []
    for (const [host, currentLocale] of clusterHosts) {
      const { router, ctx } = createTestContext(currentLocale, { domains: { host, locales: withPlain }, defaultLocale: 'nl' })
      await router.push('/')
      hrefs.push(localeHead(ctx, {}).link.find(x => x.hreflang === 'de')!.href)
    }

    // `nl` is the configured `defaultLocale` and is served unprefixed on example.nl
    expect(hrefs).toEqual(['https://example.nl/de', 'https://example.nl/de'])
  })

  test('only the locale that wins a shared `defaultForDomains` entry is linked unprefixed', async () => {
    // both claim example.nl but the route table can only unprefix one of them, so the other has to
    // keep its prefix or the two would advertise the same URL for different languages
    const locales = getNormalizedLocales([
      { code: 'nl', language: 'nl-NL', domains: ['example.nl'], defaultForDomains: ['example.nl'] },
      { code: 'be', language: 'nl-BE', domains: ['example.nl'], defaultForDomains: ['example.nl'] },
    ])
    const { router, ctx } = createTestContext('nl', { domains: { host: 'example.nl', locales }, defaultLocale: 'nl' })
    await router.push('/')

    const hrefs = localeHead(ctx, {}).link.filter(x => x.rel === 'alternate').map(x => [x.hreflang, x.href])
    expect(hrefs).toEqual([
      ['x-default', 'https://example.nl'],
      ['nl', 'https://example.nl'],
      ['nl-NL', 'https://example.nl'],
      ['nl-BE', 'https://example.nl/be'],
    ])
  })

  test('an unconfigured host keeps navigation relative while alternates stay canonical', async () => {
    // the two resolve through different base URLs
    const { router, ctx } = createTestContext('nl', { domains: { host: 'localhost:3000' } })
    await router.push('/nl')

    // relative paths resolve against this host's own table, where `en` is unprefixed (it is the
    // configured `defaultLocale`) and every other locale keeps its prefix
    expect(switchLocalePath(ctx, 'fr')).toBe('/fr')
    expect(switchLocalePath(ctx, 'en')).toBe('/')
    expect(ctx.getAlternatePath('/fr', 'fr')).toBe('https://example.be')
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
    const { router, ctx, setLocale } = createTestContext('en', { strictSeo: true })
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
    const { router, ctx } = createTestContext('en', { strictSeo: true })
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
    const { router, ctx, head } = createTestContext('en', { strictSeo: true })
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

  test('restores dynamic params when navigating within the same route', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')

    const setI18nParams = _useSetI18nParams(ctx)
    setI18nParams(chairParams)

    // every navigation builds a fresh merged route meta, so the composable
    // re-applies the params it owns
    await router.push('/products/big-chair?page=2')
    await nextTick()
    expect(router.currentRoute.value.meta.nuxtI18nInternal).toEqual(chairParams)
  })

  test('ignores a setter that resolves after the user has navigated away', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')

    // created in the page's setup, while its own route is current
    const setI18nParams = _useSetI18nParams(ctx)

    // the page's data resolves only after the user has moved on
    await router.push('/')
    await nextTick()
    setI18nParams(chairParams)

    expect(router.currentRoute.value.meta.nuxtI18nInternal).toBeUndefined()
  })

  test('does not carry dynamic params onto a different route', async () => {
    const { router, ctx } = createTestContext()
    await router.push('/products/big-chair')

    const setI18nParams = _useSetI18nParams(ctx)
    setI18nParams(chairParams)

    // the page that set these params stays mounted while the next route
    // resolves; a page that declares none must not inherit them
    await router.push('/')
    await nextTick()
    expect(router.currentRoute.value.meta.nuxtI18nInternal).toBeUndefined()
  })

  test('seo attributes override global canonicalQueries in strict seo mode', async () => {
    const { router, ctx, head } = createTestContext('en', { strictSeo: true })
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

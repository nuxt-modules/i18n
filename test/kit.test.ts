import { describe, test, expect, vi, beforeAll } from 'vitest'
import { createRoutingContext, type RoutingContext } from '../src/runtime/routing/context'
import { createMemoryHistory, createRouter, type RouteLocationRaw, type Router } from 'vue-router'
import {
  localePath as _localePath,
  switchLocalePath as _switchLocalePath,
  localeRoute as _localeRoute
} from '../src/runtime/routing/routing'
import { ref, unref } from 'vue'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import { resolve } from 'pathe'
import { localizeRoutes } from '../src/routing'
import { setupMultiDomainLocales } from '../src/runtime/routing/domain'
import { getNormalizedLocales } from './pages/utils'
import type { NuxtPage } from '@nuxt/schema'
import type { Strategies } from '#internal-i18n-types'
import { LocalizableRoute } from '../src/kit/gen'

const DEFAULT_LOCALE = 'en'

const routingOptions = {
  differentDomains: false,
  routesNameSeparator: '___',
  defaultLocaleRouteNameSuffix: 'default',
  trailingSlash: false,
  defaultLocale: DEFAULT_LOCALE,
  defaultDirection: 'ltr' as const
}

const i18nMock = {
  locale: ref('en'),
  locales: ref([
    { code: 'en', language: 'en-US' },
    { code: 'ja', language: 'ja-JP' }
  ]),
  baseUrl: ref('http://localhost')
}

// load fixture pages once, shared across strategy suites (also updates i18nMock)
let _pages: Promise<NuxtPage[]> | undefined
const loadPages = () => (_pages ??= loadFixtureAndRoutes())
async function loadFixtureAndRoutes() {
  const nuxt = await loadNuxt({
    rootDir: resolve(process.cwd(), './test/fixtures/kit'),
    configFile: 'nuxt.config',
    dev: false
  })
  const locales = getNormalizedLocales(nuxt.options.i18n.locales)
  i18nMock.locale.value = locales[0].code
  i18nMock.locales.value = locales.map(x => ({ code: x.code, language: x.language ?? x.code }))
  i18nMock.baseUrl.value = String(nuxt.options.i18n.baseUrl)
  try {
    return await new Promise<NuxtPage[]>(res => {
      nuxt.hook('pages:resolved', pages => res(pages))
      buildNuxt(nuxt)
    })
  } finally {
    nuxt.close()
  }
}

const STRATEGIES = ['prefix_and_default', 'prefix_except_default', 'prefix', 'no_prefix'] as const

/**
 * Expected path builder matching `prefixPath` in specs/routing/routing-tests.ts,
 * extended to account for the default locale being unprefixed in the
 * `prefix_except_default` and `prefix_and_default` strategies.
 */
function createPrefixPath(strategy: Strategies) {
  return (path: string = '/', locale: string = DEFAULT_LOCALE) => {
    const prefixed = strategy === 'prefix' || (strategy !== 'no_prefix' && locale !== DEFAULT_LOCALE)
    if (!prefixed) {
      return path.startsWith('/') ? path : '/' + path
    }
    return ['/', locale, path === '/' ? undefined : path].filter(Boolean).join('')
  }
}

/** Expected localized route name for the given strategy */
function createRouteName(strategy: Strategies) {
  return (base: string, locale: string = DEFAULT_LOCALE) => {
    if (strategy === 'no_prefix') { return base }
    if (strategy === 'prefix_and_default' && locale === DEFAULT_LOCALE) {
      return `${base}___${locale}___default`
    }
    return `${base}___${locale}`
  }
}

describe.each(STRATEGIES)('routing context (strategy: %s)', strategy => {
  const pp = createPrefixPath(strategy)
  const rn = createRouteName(strategy)
  let router: Router
  let ctx: RoutingContext

  beforeAll(async () => {
    const pages = await loadPages()


    const localized = localizeRoutes(pages as LocalizableRoute[], {
      ...routingOptions,
      strategy,
      locales: unref(i18nMock.locales)
    })
    router = createRouter({ routes: localized as any, history: createMemoryHistory() })
    ctx = createRoutingContext({
      router,
      defaultLocale: DEFAULT_LOCALE,
      strategy,
      routing: strategy !== 'no_prefix',
      domains: false,
      trailingSlash: false,
      strictSeo: false,
      compactRoutes: false,
      getLocale: () => unref(i18nMock.locale),
      getLocales: () => unref(i18nMock.locales),
      getBaseUrl: () => unref(i18nMock.baseUrl),
      getHost: () => 'localhost'
    })
  })

  const localePath = (route: RouteLocationRaw, locale?: string) => _localePath(ctx, route, locale)
  const localeRoute = (route: RouteLocationRaw, locale?: string) => _localeRoute(ctx, route, locale)
  const switchLocalePath = (locale: string) => _switchLocalePath(ctx, locale)

  test('localePath', async () => {
    await router.push(pp('/'))

    // path
    expect(localePath('/')).toEqual(pp('/'))
    expect(localePath('/about', 'ja')).toEqual(pp('/about', 'ja'))

    // name
    expect(localePath('index', 'ja')).toEqual(pp('/', 'ja'))
    expect(localePath('about')).toEqual(pp('/about'))

    // pathMatch
    expect(localePath('pathMatch')).toEqual(pp('/'))
    expect(localePath('pathMatch', 'ja')).toEqual(pp('', 'ja'))

    // object
    expect(localePath({ name: 'about' }, 'ja')).toEqual(pp('/about', 'ja'))

    // omit name & path
    expect(localePath({ state: { foo: 1 } })).toEqual(pp('/'))

    // preserve query parameters
    expect(localePath({ query: { foo: 1 } })).toEqual(pp('?foo=1'))
    expect(localePath({ path: '/', query: { foo: 1 } })).toEqual(pp('?foo=1'))
    expect(localePath({ name: 'about', query: { foo: 1 } })).toEqual(pp('/about?foo=1'))
    expect(localePath({ path: '/about', query: { foo: 1 } })).toEqual(pp('/about?foo=1'))
    expect(localePath('/?foo=1')).toEqual(pp('?foo=1'))
    expect(localePath('/about?foo=1')).toEqual(pp('/about?foo=1'))
    expect(localePath('/about?foo=1&test=2')).toEqual(pp('/about?foo=1&test=2'))
    expect(localePath('/path/as a test?foo=bar sentence')).toEqual(pp('/path/as a test?foo=bar+sentence'))
    // encoded path input is normalized (decoded) only when the path resolver matches a route
    // record and re-resolves it by name; `prefix` (exact-path lookup misses param routes) and
    // `no_prefix` (no path resolver) pass the raw path through and keep its encoding
    const normalizesEncoding = strategy === 'prefix_and_default' || strategy === 'prefix_except_default'
    expect(localePath('/path/as%20a%20test?foo=bar%20sentence')).toEqual(
      normalizesEncoding ? pp('/path/as a test?foo=bar+sentence') : pp('/path/as%20a%20test?foo=bar+sentence')
    )

    // preserve hash
    expect(localePath({ path: '/about', hash: '#foo=bar' })).toEqual(pp('/about#foo=bar'))

    // undefined path
    expect(localePath('/vue-i18n')).toEqual(pp('/vue-i18n'))
    // undefined name
    expect(localePath('vue-i18n')).toEqual('')

    // external
    expect(localePath('https://github.com')).toEqual('https://github.com')
    expect(localePath('mailto:example@mail.com')).toEqual('mailto:example@mail.com')
    expect(localePath('tel:+31612345678')).toEqual('tel:+31612345678')

    // (#3840) localized route as parameter
    // https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22
    const warn = vi.spyOn(console, 'warn')
    expect(localePath(router.currentRoute.value, 'ja')).toEqual(pp('/', 'ja'))
    expect(localePath({ name: 'index___en' }, 'ja')).toEqual(pp('/', 'ja'))
    expect(warn.mock.calls.find(call => String(call[0]).includes('Discarded invalid param(s)'))).toBeUndefined()
    warn.mockRestore()
  })

  test('localeRoute', async () => {
    await router.push(pp('/'))

    expect(localeRoute('/')).toMatchObject({
      fullPath: pp('/'),
      path: pp('/'),
      name: rn('index'),
      href: pp('/')
    })

    expect(localeRoute('index', 'ja')).toMatchObject({
      fullPath: pp('/', 'ja'),
      path: pp('/', 'ja'),
      name: rn('index', 'ja'),
      href: pp('/', 'ja')
    })

    expect(localeRoute('about')).toMatchObject({
      fullPath: pp('/about'),
      path: pp('/about'),
      name: rn('about'),
      href: pp('/about')
    })

    expect(localeRoute('/about', 'ja')).toMatchObject({
      fullPath: pp('/about', 'ja'),
      path: pp('/about', 'ja'),
      name: rn('about', 'ja'),
      href: pp('/about', 'ja')
    })

    expect(localeRoute({ name: 'about' }, 'ja')).toMatchObject({
      fullPath: pp('/about', 'ja'),
      name: rn('about', 'ja')
    })

    // name
    expect(localeRoute('pathMatch')).toMatchObject({
      fullPath: pp('/'),
      name: rn('pathMatch')
    })
    expect(localeRoute('pathMatch', 'ja')).toMatchObject({
      fullPath: pp('', 'ja'),
      name: rn('pathMatch', 'ja')
    })

    // undefined path
    expect(localeRoute('/vue-i18n', 'ja')).toMatchObject({
      fullPath: pp('/vue-i18n', 'ja'),
      name: rn('pathMatch', 'ja'),
      params: { pathMatch: ['vue-i18n'] }
    })

    // undefined name
    expect(localeRoute('vue-i18n', 'ja')).toBeUndefined()
  })

  test('switchLocalePath', async () => {
    await router.push(pp('/'))
    expect(switchLocalePath('en')).toEqual(pp('/', 'en'))
    expect(switchLocalePath('ja')).toEqual(pp('/', 'ja'))
    // resolving an unsupported locale fails and returns an empty path,
    // except in `no_prefix` where route names and paths are not localized
    expect(switchLocalePath('undefined')).toEqual(strategy === 'no_prefix' ? pp('/') : '')

    await router.push(pp('/about', 'ja'))
    expect(switchLocalePath('en')).toEqual(pp('/about', 'en'))
    expect(switchLocalePath('ja')).toEqual(pp('/about', 'ja'))

    // preserve query parameters
    await router.push(pp('/about', 'ja') + '?foo=1&test=2')
    expect(switchLocalePath('en')).toEqual(pp('/about', 'en') + '?foo=1&test=2')
    expect(switchLocalePath('ja')).toEqual(pp('/about', 'ja') + '?foo=1&test=2')

    await router.push(pp('/about', 'ja') + '?foo=bär&four=四&foo=bar')
    expect(switchLocalePath('en')).toEqual(pp('/about', 'en') + '?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
    expect(switchLocalePath('ja')).toEqual(pp('/about', 'ja') + '?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')

    await router.push(pp('/about', 'ja') + '?foo=é')
    expect(switchLocalePath('ja')).toEqual(pp('/about', 'ja') + '?foo=%C3%A9')

    // preserve hash
    await router.push(pp('/about', 'ja') + '#foo=bar')
    expect(switchLocalePath('en')).toEqual(pp('/about', 'en') + '#foo=bar')
    expect(switchLocalePath('ja')).toEqual(pp('/about', 'ja') + '#foo=bar')

    // preserve unicode dynamic params
    await router.push(pp('/count/三', 'ja'))
    expect(switchLocalePath('en')).toEqual(pp('/count/三', 'en'))
    expect(switchLocalePath('ja')).toEqual(pp('/count/三', 'ja'))

    await router.push(pp('/count/三', 'ja') + '?foo=bär&four=四&foo=bar')
    expect(switchLocalePath('en')).toEqual(pp('/count/三', 'en') + '?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
    expect(switchLocalePath('ja')).toEqual(pp('/count/三', 'ja') + '?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
  })
})

describe('switchLocalePath with differentDomains', () => {
  test('cross-domain links use the target domain shape', async () => {
    const locales = [
      { code: 'en', language: 'en', domain: 'en.example.com', defaultForDomains: ['en.example.com'] },
      { code: 'no', language: 'no', domain: 'en.example.com' },
      { code: 'fr', language: 'fr', domain: 'fr.example.com', defaultForDomains: ['fr.example.com'] }
    ]
    const localized = localizeRoutes([{ path: '/about', name: 'about' }] as LocalizableRoute[], {
      ...routingOptions,
      strategy: 'prefix_except_default',
      defaultLocale: '',
      differentDomains: true,
      locales
    })
    const router = createRouter({ routes: localized as any, history: createMemoryHistory() })
    // acting as `fr.example.com`
    setupMultiDomainLocales('fr', 'prefix_except_default', router)

    const ctx = createRoutingContext({
      router,
      defaultLocale: '',
      strategy: 'prefix_except_default',
      routing: true,
      domains: true,
      trailingSlash: false,
      strictSeo: false,
      compactRoutes: false,
      getLocale: () => 'fr',
      getLocales: () => locales,
      getBaseUrl: locale => `http://${locales.find(l => l.code === (locale ?? 'fr'))?.domain}`,
      getHost: () => 'fr.example.com'
    })

    await router.push('/about')
    // off-host targets get absolute URLs in the target domain's shape
    expect(_switchLocalePath(ctx, 'en')).toBe('http://en.example.com/about')
    expect(_switchLocalePath(ctx, 'no')).toBe('http://en.example.com/no/about')
    // on-host targets navigate relative
    expect(_switchLocalePath(ctx, 'fr')).toBe('/about')
  })
})

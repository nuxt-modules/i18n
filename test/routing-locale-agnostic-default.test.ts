import { describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutingContext } from '../src/runtime/routing/context'
import { localePath, switchLocalePath } from '../src/runtime/routing/routing'
import { localizeRoutes } from '../src/routing'
import { getNormalizedLocales } from './pages/utils'

import type { RouteRecordRaw } from 'vue-router'
import type { RoutingContext } from '../src/runtime/routing/context'
import type { LocalizableRoute } from '../src/kit/gen'

/**
 * `experimental.localeAgnosticDefaultRoutes` under `prefix_except_default`.
 *
 * The scenario is one build serving several deployments: the build defaults to `en`, a build step
 * names the unprefixed tree `___default` instead of `___en`, and each deployment sets its own
 * `defaultLocale` through runtime config. The flag is what lets the getter reach that tree for a
 * default locale the build never knew about.
 */

// The compact branch of `resolveLocalizedRouteByName` is gated on `isSupportedLocale`, which reads
// `localeCodes` from the build - and the shared test mock leaves that empty, so the branch is
// unreachable without declaring the locales this file generates routes for.
vi.mock('#build/i18n-options.mjs', async importOriginal => ({
  ...(await importOriginal() as object),
  localeCodes: ['en', 'fr', 'ja'],
}))

const locales = getNormalizedLocales([
  { code: 'en', language: 'en' },
  { code: 'fr', language: 'fr' },
  { code: 'ja', language: 'ja-JP' },
])

const component = {}

const prefixedRoutes = (codes: string[]) =>
  codes.flatMap(code => [
    { name: `index___${code}`, path: `/${code}`, component },
    { name: `about___${code}`, path: `/${code}/about`, component },
  ])

/** Route table of a normal build: the unprefixed tree carries the build's default locale */
const perLocaleRoutes = [
  { name: 'index___en', path: '/', component },
  { name: 'about___en', path: '/about', component },
  ...prefixedRoutes(['fr', 'ja']),
]

/**
 * Same build after the one-image build step: the unprefixed tree is renamed `___default`, and every
 * locale - including the build's own `en` - keeps a prefixed tree, since any of them may end up
 * being the prefixed one on a given deployment.
 */
const agnosticRoutes = [
  { name: 'index___default', path: '/', component },
  { name: 'about___default', path: '/about', component },
  ...prefixedRoutes(['en', 'fr', 'ja']),
]

function createTestContext(opts: {
  defaultLocale: string
  agnostic?: boolean
  routes?: RouteRecordRaw[]
  compactRoutes?: boolean
}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: opts.routes ?? (opts.agnostic ? agnosticRoutes : perLocaleRoutes),
  })
  vi.stubGlobal('__I18N_LOCALE_AGNOSTIC_DEFAULT_ROUTES__', !!opts.agnostic)
  const ctx: RoutingContext = createRoutingContext({
    router,
    // the host's unprefixed locale, resolved from runtime config by the plugin
    defaultLocale: opts.defaultLocale,
    configuredDefaultLocale: 'en',
    strategy: 'prefix_except_default',
    routing: true,
    domains: false,
    trailingSlash: false,
    strictSeo: false,
    compactRoutes: !!opts.compactRoutes,
    getLocale: () => opts.defaultLocale,
    getLocales: () => locales,
    getBaseUrl: () => 'https://example.com',
    getCanonicalBaseUrl: () => 'https://example.com',
    getHost: () => 'example.com',
  })
  return { ctx, router }
}

describe('experimental.localeAgnosticDefaultRoutes', () => {
  test('off: the default locale is the one the build baked in', () => {
    const { ctx } = createTestContext({ defaultLocale: 'en' })

    expect(localePath(ctx, 'index', 'en')).toEqual('/')
    expect(localePath(ctx, 'about', 'en')).toEqual('/about')
    expect(localePath(ctx, 'about', 'ja')).toEqual('/ja/about')
  })

  test('off: a runtime default locale cannot reach the renamed tree', () => {
    const { ctx } = createTestContext({ defaultLocale: 'ja', routes: agnosticRoutes })

    // `about___ja` is the prefixed tree, so the deployment's unprefixed locale stays prefixed
    expect(localePath(ctx, 'about', 'ja')).toEqual('/ja/about')
  })

  test('on: the default locale resolves to the locale-agnostic tree', () => {
    const { ctx } = createTestContext({ defaultLocale: 'ja', agnostic: true })

    expect(localePath(ctx, 'index', 'ja')).toEqual('/')
    expect(localePath(ctx, 'about', 'ja')).toEqual('/about')
  })

  test('on: non-default locales are untouched', () => {
    const { ctx } = createTestContext({ defaultLocale: 'ja', agnostic: true })

    expect(localePath(ctx, 'about', 'fr')).toEqual('/fr/about')
    // `en` is no longer the unprefixed locale here, and resolves as any other prefixed one
    expect(localePath(ctx, 'about', 'en')).toEqual('/en/about')
  })

  test('on: any locale can be the unprefixed one, from the same route table', () => {
    for (const defaultLocale of ['en', 'fr', 'ja']) {
      const { ctx } = createTestContext({ defaultLocale, agnostic: true })
      expect(localePath(ctx, 'about', defaultLocale)).toEqual('/about')
    }
  })

  test('on: switchLocalePath crosses between the agnostic and prefixed trees', async () => {
    const { ctx, router } = createTestContext({ defaultLocale: 'ja', agnostic: true })

    await router.push('/about')
    expect(switchLocalePath(ctx, 'fr')).toEqual('/fr/about')

    await router.push('/fr/about')
    expect(switchLocalePath(ctx, 'ja')).toEqual('/about')
  })

  test('on: falls back to the per-locale name when the agnostic tree is absent', () => {
    // the flag is enabled but the build step that renames the tree did not run
    const { ctx } = createTestContext({ defaultLocale: 'en', agnostic: true, routes: perLocaleRoutes })

    expect(localePath(ctx, 'about', 'en')).toEqual('/about')
    expect(localePath(ctx, 'about', 'ja')).toEqual('/ja/about')
  })
})

/**
 * The intended pairing from #4016: `compactRoutes` collapses the prefixed locales into one
 * `/:locale(…)` route, so the two features meet in `resolveLocalizedRouteByName` - the default
 * locale resolves by name through the agnostic tree, while every other locale takes the compact
 * branch and gets `locale` injected as a route param. Built from `localizeRoutes` rather than by
 * hand so the fixture is the table the generator actually emits.
 */
describe('getLocaleRouteName: + experimental.compactRoutes', () => {
  const pages: LocalizableRoute[] = [
    { name: 'index', path: '/', file: 'index.vue' },
    {
      name: 'about',
      path: '/about',
      file: 'about.vue',
      children: [{ name: 'about-team', path: 'team', file: 'team.vue' }],
    },
  ]

  const generated = localizeRoutes(pages, {
    strategy: 'prefix_except_default',
    trailingSlash: false,
    differentDomains: false,
    locales,
    routesNameSeparator: '___',
    defaultLocaleRouteNameSuffix: 'default',
    defaultLocale: 'en',
    compactRoutes: true,
  })

  /**
   * What a consumer's `pages:resolved` hook does today, and what generating the tree natively
   * (follow-up 1 in #4016) would make unnecessary: rename the unprefixed `___en` tree to the
   * agnostic name, and widen the compact pattern so `en` is prefixable like any other locale.
   */
  function toLocaleAgnostic(routes: LocalizableRoute[]): RouteRecordRaw[] {
    return routes.map((route) => {
      const renamed = {
        ...route,
        component: {},
        path: route.path.replace(/^\/:locale\(([^)]+)\)/, '/:locale(en|$1)'),
        name: route.name?.replace(/___en$/, '___default'),
        children: route.children && toLocaleAgnostic(route.children),
      }
      return renamed as unknown as RouteRecordRaw
    })
  }

  const compactRoutes = toLocaleAgnostic(generated)
  const compactOpts = { routes: compactRoutes, compactRoutes: true }

  test('the generated table is the one this pairing produces', () => {
    const flatten = (routes: RouteRecordRaw[]): string[] =>
      routes.flatMap(r => [`${String(r.name)} :: ${r.path}`, ...flatten(r.children ?? [])])

    expect(flatten(compactRoutes)).toEqual([
      'index___default :: /',
      'index :: /:locale(en|fr|ja)',
      'about___default :: /about',
      'about-team___default :: team',
      'about :: /:locale(en|fr|ja)/about',
      'about-team :: team',
    ])
  })

  test('off: the runtime default locale is stuck on the compact prefixed route', () => {
    const { ctx } = createTestContext({ ...compactOpts, defaultLocale: 'ja' })

    // `about___ja` does not exist, so the compact branch injects `ja` as the param - a prefixed
    // path for the locale that is supposed to be unprefixed on this deployment
    expect(localePath(ctx, 'about', 'ja')).toEqual('/ja/about')
  })

  test('on: the runtime default locale resolves through the agnostic tree', () => {
    const { ctx } = createTestContext({ ...compactOpts, defaultLocale: 'ja', agnostic: true })

    expect(localePath(ctx, 'index', 'ja')).toEqual('/')
    expect(localePath(ctx, 'about', 'ja')).toEqual('/about')
    // the agnostic tree keeps its real parent chain, unlike the flat compact route
    expect(localePath(ctx, 'about-team', 'ja')).toEqual('/about/team')
  })

  test('on: the other locales still resolve through the compact route', () => {
    const { ctx } = createTestContext({ ...compactOpts, defaultLocale: 'ja', agnostic: true })

    expect(localePath(ctx, 'about', 'fr')).toEqual('/fr/about')
    expect(localePath(ctx, 'about-team', 'fr')).toEqual('/fr/about/team')
    // `en` built the routes but is just another prefixed locale on this deployment
    expect(localePath(ctx, 'about', 'en')).toEqual('/en/about')
  })

  test('on: switchLocalePath crosses between the agnostic and compact trees', async () => {
    const { ctx, router } = createTestContext({
      ...compactOpts,
      defaultLocale: 'ja',
      agnostic: true,
    })

    await router.push('/about')
    expect(switchLocalePath(ctx, 'fr')).toEqual('/fr/about')

    await router.push('/fr/about')
    expect(switchLocalePath(ctx, 'ja')).toEqual('/about')
  })
})

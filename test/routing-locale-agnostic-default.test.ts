import { describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutingContext } from '../src/runtime/routing/context'
import { localePath, switchLocalePath } from '../src/runtime/routing/routing'
import { getNormalizedLocales } from './pages/utils'

import type { RoutingContext } from '../src/runtime/routing/context'

/**
 * `experimental.localeAgnosticDefaultRoutes` under `prefix_except_default`.
 *
 * The scenario is one build serving several deployments: the build defaults to `en`, a build step
 * names the unprefixed tree `___default` instead of `___en`, and each deployment sets its own
 * `defaultLocale` through runtime config. The flag is what lets the getter reach that tree for a
 * default locale the build never knew about.
 */

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

function createTestContext(opts: { defaultLocale: string, agnostic?: boolean, routes?: typeof perLocaleRoutes }) {
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
    compactRoutes: false,
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

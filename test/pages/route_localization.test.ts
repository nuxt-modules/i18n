import { describe, it, expect } from 'vitest'
import { localizeRoutes } from '../../src/routing'
import { localizeSingleRoute, createRouteContext, canCompactRoute } from '../../src/kit/gen'
import { buildPathToConfig, NuxtPageAnalyzeContext } from '../../src/pages'
import { createMockOptionsResolver, createTestConfig, getNormalizedLocales } from './utils'

import type { LocalizableRoute, LocalizeRouteParams } from '../../src/kit/gen'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find a route in a flat array by name */
const findRoute = (routes: LocalizableRoute[], name: string) => routes.find(r => r.name === name)

/** Collect all route names from a flat array */
const routeNames = (routes: LocalizableRoute[]) => routes.map(r => r.name).filter(Boolean)

/** Collect all route paths from a flat array */
const routePaths = (routes: LocalizableRoute[]) => routes.map(r => r.path)

/** Simple shouldPrefix that respects child relative paths */
const defaultShouldPrefix = (path: string, _locale: string, options: LocalizeRouteParams) => {
  if (options.parent != null && !path.startsWith('/')) return false
  return true
}

// ---------------------------------------------------------------------------
// a) localizeSingleRoute unit tests
// ---------------------------------------------------------------------------

describe('localizeSingleRoute', () => {
  it('prefixes route for each locale', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver(),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about' }
    const params: LocalizeRouteParams = {
      locales: ['en', 'fr'],
      defaultTree: false,
      shouldPrefix: () => true,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(2)
    expect(findRoute(result, 'about___en')?.path).toBe('/en/about')
    expect(findRoute(result, 'about___fr')?.path).toBe('/fr/about')
  })

  it('does not prefix when shouldPrefix returns false', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver(),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about' }
    const params: LocalizeRouteParams = {
      locales: ['en', 'fr'],
      defaultTree: false,
      shouldPrefix: () => false,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(2)
    expect(result.every(r => r.path === '/about')).toBe(true)
  })

  it('uses custom path from resolver for specific locale', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver({
        about: { locales: ['en', 'fr'], paths: { fr: '/a-propos' } },
      }),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about' }
    const params: LocalizeRouteParams = {
      locales: ['en', 'fr'],
      defaultTree: false,
      shouldPrefix: () => true,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(findRoute(result, 'about___en')?.path).toBe('/en/about')
    expect(findRoute(result, 'about___fr')?.path).toBe('/fr/a-propos')
  })

  it('returns route unchanged when resolver returns undefined', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver({ about: undefined }),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about' }
    const params: LocalizeRouteParams = {
      locales: ['en', 'fr'],
      defaultTree: false,
      shouldPrefix: () => true,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(route)
  })

  it('only produces routes for locales in resolver result', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver({
        about: { locales: ['en'], paths: {} },
      }),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about' }
    const params: LocalizeRouteParams = {
      locales: ['en', 'fr'],
      defaultTree: false,
      shouldPrefix: () => true,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('about___en')
  })

  it('localizes children with relative paths', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver(),
    })

    const route: LocalizableRoute = {
      path: '/user/:id',
      name: 'user',
      children: [
        { path: 'profile', name: 'user-profile' },
        { path: 'posts', name: 'user-posts' },
      ],
    }

    const params: LocalizeRouteParams = {
      locales: ['en', 'fr'],
      defaultTree: false,
      shouldPrefix: defaultShouldPrefix,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(2)
    const enRoute = findRoute(result, 'user___en')!
    expect(enRoute.path).toBe('/en/user/:id')
    expect(enRoute.children).toHaveLength(2)
    expect(enRoute.children![0].name).toBe('user-profile___en')
    expect(enRoute.children![0].path).toBe('profile')

    const frRoute = findRoute(result, 'user___fr')!
    expect(frRoute.path).toBe('/fr/user/:id')
    expect(frRoute.children).toHaveLength(2)
    expect(frRoute.children![0].name).toBe('user-profile___fr')
  })

  it('localizes aliases', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver(),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about', alias: '/about-us' }
    const params: LocalizeRouteParams = {
      locales: ['en'],
      defaultTree: false,
      shouldPrefix: () => true,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(1)
    expect(result[0].alias).toEqual(['/en/about-us'])
  })

  it('uses default tree naming when defaultTree is true', () => {
    const ctx = createRouteContext({
      trailingSlash: false,
      defaultLocales: ['en'],
      routesNameSeparator: '___',
      defaultLocaleRouteNameSuffix: 'default',
      optionsResolver: createMockOptionsResolver(),
    })

    const route: LocalizableRoute = { path: '/about', name: 'about' }
    const params: LocalizeRouteParams = {
      locales: ['en'],
      defaultTree: true,
      shouldPrefix: () => false,
    }

    const result = localizeSingleRoute(route, params, ctx)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('about___en___default')
  })
})

// ---------------------------------------------------------------------------
// b) localizeRoutes strategy tests
// ---------------------------------------------------------------------------

describe('localizeRoutes strategies', () => {
  const routes: LocalizableRoute[] = [
    { path: '/', name: 'home' },
    { path: '/about', name: 'about' },
  ]

  describe('prefix_except_default', () => {
    it('default locale is unprefixed, non-default is prefixed', () => {
      const config = createTestConfig({ locales: ['en', 'fr'], strategy: 'prefix_except_default', defaultLocale: 'en' })
      const result = localizeRoutes(routes, config)

      // en (default) - unprefixed
      expect(findRoute(result, 'home___en')?.path).toBe('/')
      expect(findRoute(result, 'about___en')?.path).toBe('/about')
      // fr (non-default) - prefixed
      expect(findRoute(result, 'home___fr')?.path).toBe('/fr')
      expect(findRoute(result, 'about___fr')?.path).toBe('/fr/about')
      // no default tree routes
      expect(findRoute(result, 'home___en___default')).toBeUndefined()
    })
  })

  describe('prefix_and_default', () => {
    it('default locale gets both unprefixed (default tree) and prefixed routes', () => {
      const config = createTestConfig({ locales: ['en', 'fr'], strategy: 'prefix_and_default', defaultLocale: 'en' })
      const result = localizeRoutes(routes, config)

      // en default tree (unprefixed)
      expect(findRoute(result, 'home___en___default')?.path).toBe('/')
      expect(findRoute(result, 'about___en___default')?.path).toBe('/about')
      // en prefixed
      expect(findRoute(result, 'home___en')?.path).toBe('/en')
      expect(findRoute(result, 'about___en')?.path).toBe('/en/about')
      // fr prefixed
      expect(findRoute(result, 'home___fr')?.path).toBe('/fr')
      expect(findRoute(result, 'about___fr')?.path).toBe('/fr/about')
      // no default tree for non-default locale
      expect(findRoute(result, 'home___fr___default')).toBeUndefined()
    })
  })

  describe('prefix', () => {
    it('all locales are prefixed', () => {
      const config = createTestConfig({ locales: ['en', 'fr'], strategy: 'prefix', defaultLocale: 'en' })
      const result = localizeRoutes(routes, config)

      expect(findRoute(result, 'home___en')?.path).toBe('/en')
      expect(findRoute(result, 'about___en')?.path).toBe('/en/about')
      expect(findRoute(result, 'home___fr')?.path).toBe('/fr')
      expect(findRoute(result, 'about___fr')?.path).toBe('/fr/about')
    })

    it('with includeUnprefixedFallback, default locale also gets unprefixed copy', () => {
      const config = createTestConfig({
        locales: ['en', 'fr'],
        strategy: 'prefix',
        defaultLocale: 'en',
        includeUnprefixedFallback: true,
      })
      const result = localizeRoutes(routes, config)

      // unprefixed fallback for default locale (original route without locale suffix)
      const homeUnprefixed = result.find(r => r.name === 'home' && r.path === '/')
      expect(homeUnprefixed).toBeDefined()
      const aboutUnprefixed = result.find(r => r.name === 'about' && r.path === '/about')
      expect(aboutUnprefixed).toBeDefined()

      // prefixed routes still exist
      expect(findRoute(result, 'home___en')?.path).toBe('/en')
      expect(findRoute(result, 'home___fr')?.path).toBe('/fr')
    })
  })

  describe('no_prefix', () => {
    it('routes pass through unchanged without differentDomains', () => {
      const config = createTestConfig({ locales: ['en', 'fr'], strategy: 'no_prefix', defaultLocale: 'en' })
      const result = localizeRoutes(routes, config)

      // routes are returned as-is
      expect(result).toHaveLength(2)
      expect(result[0].path).toBe('/')
      expect(result[0].name).toBe('home')
      expect(result[1].path).toBe('/about')
      expect(result[1].name).toBe('about')
    })
  })
})

// ---------------------------------------------------------------------------
// c) Custom paths via mock resolver
// ---------------------------------------------------------------------------

describe('localizeRoutes with custom paths', () => {
  it('applies per-locale custom paths', () => {
    const resolver = createMockOptionsResolver({
      about: { locales: ['en', 'fr'], paths: { fr: '/a-propos' } },
    })
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
    })
    const routes: LocalizableRoute[] = [
      { path: '/', name: 'home' },
      { path: '/about', name: 'about' },
    ]

    const result = localizeRoutes(routes, config)

    // en default locale - unprefixed, uses original path
    expect(findRoute(result, 'about___en')?.path).toBe('/about')
    // fr non-default - prefixed, uses custom path
    expect(findRoute(result, 'about___fr')?.path).toBe('/fr/a-propos')
    // home routes are unaffected
    expect(findRoute(result, 'home___en')?.path).toBe('/')
    expect(findRoute(result, 'home___fr')?.path).toBe('/fr')
  })

  it('applies custom paths for all locales', () => {
    const resolver = createMockOptionsResolver({
      about: { locales: ['en', 'fr'], paths: { en: '/about-us', fr: '/a-propos' } },
    })
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
    })
    const routes: LocalizableRoute[] = [{ path: '/about', name: 'about' }]
    const result = localizeRoutes(routes, config)

    expect(findRoute(result, 'about___en')?.path).toBe('/about-us')
    expect(findRoute(result, 'about___fr')?.path).toBe('/fr/a-propos')
  })

  it('disables localization for a specific route', () => {
    const resolver = createMockOptionsResolver({ secret: false })
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
    })
    const routes: LocalizableRoute[] = [
      { path: '/', name: 'home' },
      { path: '/secret', name: 'secret' },
    ]
    const result = localizeRoutes(routes, config)

    // secret route is passed through unchanged
    const secret = result.find(r => r.name === 'secret')
    expect(secret).toBeDefined()
    expect(secret!.path).toBe('/secret')
    // only one secret route (not duplicated per locale)
    expect(result.filter(r => r.name === 'secret')).toHaveLength(1)
    // home is still localized
    expect(findRoute(result, 'home___en')).toBeDefined()
    expect(findRoute(result, 'home___fr')).toBeDefined()
  })

  it('restricts route to subset of locales', () => {
    const resolver = createMockOptionsResolver({
      about: { locales: ['en'], paths: {} },
    })
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
    })
    const routes: LocalizableRoute[] = [{ path: '/about', name: 'about' }]
    const result = localizeRoutes(routes, config)

    expect(findRoute(result, 'about___en')).toBeDefined()
    expect(findRoute(result, 'about___fr')).toBeUndefined()
  })

  it('handles nested routes with custom parent path', () => {
    const resolver = createMockOptionsResolver({
      account: { locales: ['en', 'fr'], paths: { fr: '/compte' } },
    })
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
    })
    const routes: LocalizableRoute[] = [
      {
        path: '/account',
        name: 'account',
        children: [
          { path: 'profile', name: 'account-profile' },
        ],
      },
    ]
    const result = localizeRoutes(routes, config)

    const enAccount = findRoute(result, 'account___en')!
    expect(enAccount.path).toBe('/account')
    expect(enAccount.children![0].name).toBe('account-profile___en')
    expect(enAccount.children![0].path).toBe('profile')

    const frAccount = findRoute(result, 'account___fr')!
    expect(frAccount.path).toBe('/fr/compte')
    expect(frAccount.children![0].name).toBe('account-profile___fr')
    expect(frAccount.children![0].path).toBe('profile')
  })

  it('handles dynamic route parameters', () => {
    const resolver = createMockOptionsResolver({
      'blog-slug': { locales: ['en', 'fr'], paths: { fr: '/article/:slug' } },
    })
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
    })
    const routes: LocalizableRoute[] = [
      { path: '/blog/:slug', name: 'blog-slug' },
    ]
    const result = localizeRoutes(routes, config)

    expect(findRoute(result, 'blog-slug___en')?.path).toBe('/blog/:slug')
    expect(findRoute(result, 'blog-slug___fr')?.path).toBe('/fr/article/:slug')
  })
})

// ---------------------------------------------------------------------------
// Trailing slash and route name separator
// ---------------------------------------------------------------------------

describe('localizeRoutes options', () => {
  it('appends trailing slash when configured', () => {
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      trailingSlash: true,
    })
    const routes: LocalizableRoute[] = [
      { path: '/', name: 'home' },
      { path: '/about', name: 'about' },
    ]
    const result = localizeRoutes(routes, config)

    expect(findRoute(result, 'home___en')?.path).toBe('/')
    expect(findRoute(result, 'home___fr')?.path).toBe('/fr/')
    expect(findRoute(result, 'about___en')?.path).toBe('/about/')
    expect(findRoute(result, 'about___fr')?.path).toBe('/fr/about/')
  })

  it('uses custom route name separator', () => {
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      routesNameSeparator: '__',
    })
    const routes: LocalizableRoute[] = [{ path: '/about', name: 'about' }]
    const result = localizeRoutes(routes, config)

    expect(result.some(r => r.name === 'about__en')).toBe(true)
    expect(result.some(r => r.name === 'about__fr')).toBe(true)
  })

  it('uses custom default locale route name suffix', () => {
    const config = createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_and_default',
      defaultLocale: 'en',
      defaultLocaleRouteNameSuffix: 'fallback',
    })
    const routes: LocalizableRoute[] = [{ path: '/about', name: 'about' }]
    const result = localizeRoutes(routes, config)

    expect(result.some(r => r.name === 'about___en___fallback')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// d) buildPathToConfig
// ---------------------------------------------------------------------------

describe('buildPathToConfig', () => {
  function makeCtx(fileToPath: Record<string, string> = {}): NuxtPageAnalyzeContext {
    const ctx = new NuxtPageAnalyzeContext({})
    ctx.fileToPath = fileToPath
    return ctx
  }

  it('marks all locales as true for a route with no custom paths', () => {
    const ctx = makeCtx({ '/pages/about.vue': '/about' })
    const resolver = createMockOptionsResolver({
      about: { locales: ['en', 'fr'], paths: {} },
    })
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      { path: '/about', name: 'about', file: '/pages/about.vue' },
    ])
    expect(ctx.pathToConfig['/about']).toEqual({ en: true, fr: true })
  })

  it('stores srcPath string for locale with a custom path', () => {
    const ctx = makeCtx({ '/pages/about.vue': '/about' })
    const resolver = createMockOptionsResolver({
      about: { locales: ['en', 'fr'], paths: { fr: '/a-propos' }, srcPaths: { fr: '/a-propos' } },
    })
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      { path: '/about', name: 'about', file: '/pages/about.vue' },
    ])
    expect(ctx.pathToConfig['/about']).toEqual({ en: true, fr: '/a-propos' })
  })

  it('marks all locales as false when resolver returns undefined (disabled route)', () => {
    const ctx = makeCtx({ '/pages/secret.vue': '/secret' })
    const resolver = createMockOptionsResolver({ secret: false })
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      { path: '/secret', name: 'secret', file: '/pages/secret.vue' },
    ])
    expect(ctx.pathToConfig['/secret']).toEqual({ en: false, fr: false })
  })

  it('skips routes without a file', () => {
    const ctx = makeCtx({})
    const resolver = createMockOptionsResolver()
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      { path: '/about', name: 'about' },
    ])
    expect(Object.keys(ctx.pathToConfig)).toHaveLength(0)
  })

  it('skips routes whose file is not in fileToPath', () => {
    const ctx = makeCtx({})
    const resolver = createMockOptionsResolver()
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      { path: '/about', name: 'about', file: '/pages/about.vue' },
    ])
    expect(Object.keys(ctx.pathToConfig)).toHaveLength(0)
  })

  it('recurses into children routes', () => {
    const ctx = makeCtx({
      '/pages/account.vue': '/account',
      '/pages/account/profile.vue': '/account/profile',
    })
    const resolver = createMockOptionsResolver()
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      {
        path: '/account',
        name: 'account',
        file: '/pages/account.vue',
        children: [
          { path: 'profile', name: 'account-profile', file: '/pages/account/profile.vue' },
        ],
      },
    ])
    expect(ctx.pathToConfig['/account']).toEqual({ en: true, fr: true })
    expect(ctx.pathToConfig['/account/profile']).toEqual({ en: true, fr: true })
  })

  it('processes multiple top-level routes', () => {
    const ctx = makeCtx({
      '/pages/home.vue': '/',
      '/pages/about.vue': '/about',
    })
    const resolver = createMockOptionsResolver()
    buildPathToConfig(ctx, ['en', 'fr'], resolver, [
      { path: '/', name: 'home', file: '/pages/home.vue' },
      { path: '/about', name: 'about', file: '/pages/about.vue' },
    ])
    expect(ctx.pathToConfig['/']).toEqual({ en: true, fr: true })
    expect(ctx.pathToConfig['/about']).toEqual({ en: true, fr: true })
  })
})

// ---------------------------------------------------------------------------
// e) canCompactRoute
// ---------------------------------------------------------------------------

describe('canCompactRoute', () => {
  const allLocales = ['en', 'fr', 'ja']

  it('returns true when all locales enabled and no custom paths', () => {
    expect(canCompactRoute({ locales: ['en', 'fr', 'ja'], paths: {} }, allLocales)).toBe(true)
  })

  it('returns false when some locales have custom paths', () => {
    expect(canCompactRoute({ locales: ['en', 'fr', 'ja'], paths: { fr: '/a-propos' } }, allLocales)).toBe(false)
  })

  it('returns false when only a subset of locales is enabled', () => {
    expect(canCompactRoute({ locales: ['en', 'fr'], paths: {} }, allLocales)).toBe(false)
  })

  it('returns false when routeOptions is undefined', () => {
    expect(canCompactRoute(undefined, allLocales)).toBe(false)
  })

  it('returns true for single locale with no custom paths', () => {
    expect(canCompactRoute({ locales: ['en'], paths: {} }, ['en'])).toBe(true)
  })

  it('returns false when paths is non-empty even if values match original', () => {
    expect(canCompactRoute({ locales: ['en', 'fr'], paths: { en: '/about', fr: '/about' } }, ['en', 'fr'])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// f) compact routes via localizeRoutes
// ---------------------------------------------------------------------------

describe('compact routes', () => {
  const locales = ['en', 'fr', 'ja']
  const routes: LocalizableRoute[] = [
    { path: '/', name: 'home' },
    { path: '/about', name: 'about' },
  ]

  describe('eligible routes — prefix strategy', () => {
    it('compacts into a single regex route', () => {
      const config = createTestConfig({ locales, strategy: 'prefix', defaultLocale: 'en', compactRoutes: true })
      const result = localizeRoutes(routes, config)

      // single route per page — no per-locale duplication
      expect(result.filter(r => r.path?.includes('/about'))).toHaveLength(1)
      const about = result.find(r => r.path === '/:locale(en|fr|ja)/about')
      expect(about).toBeDefined()
      expect(about?.name).toBe('about')
      expect((about?.meta as Record<string, unknown>)?.__i18nCompact).toBe(true)
    })
  })

  describe('eligible routes — prefix_except_default strategy', () => {
    it('generates unprefixed default route + non-default regex route', () => {
      const config = createTestConfig({ locales, strategy: 'prefix_except_default', defaultLocale: 'en', compactRoutes: true })
      const result = localizeRoutes(routes, config)

      const aboutEn = findRoute(result, 'about___en')
      expect(aboutEn?.path).toBe('/about')

      const aboutRegex = result.find(r => r.path === '/:locale(fr|ja)/about')
      expect(aboutRegex).toBeDefined()
      expect(aboutRegex?.name).toBe('about')

      // no per-locale duplication for non-default locales
      expect(findRoute(result, 'about___fr')).toBeUndefined()
      expect(findRoute(result, 'about___ja')).toBeUndefined()
    })
  })

  describe('eligible routes — prefix_and_default strategy', () => {
    it('generates default-tree route + all-locale regex route', () => {
      const config = createTestConfig({ locales, strategy: 'prefix_and_default', defaultLocale: 'en', compactRoutes: true })
      const result = localizeRoutes(routes, config)

      const aboutDefault = findRoute(result, 'about___en___default')
      expect(aboutDefault?.path).toBe('/about')

      const aboutRegex = result.find(r => r.path === '/:locale(en|fr|ja)/about')
      expect(aboutRegex).toBeDefined()
      expect(aboutRegex?.name).toBe('about')

      // no per-locale routes
      expect(findRoute(result, 'about___en')).toBeUndefined()
      expect(findRoute(result, 'about___fr')).toBeUndefined()
    })
  })

  // The Nuxt module wrapper passes `includeUnprefixedFallback: true` for any
  // strategy other than `prefix`, even though the flag is only consulted when
  // strategy === 'prefix'. The compactRoutes gate must not treat that as a
  // disable signal — see issue #3971.
  describe('compactRoutes is not blocked by includeUnprefixedFallback for non-prefix strategies', () => {
    it('compacts under prefix_except_default + includeUnprefixedFallback: true', () => {
      const config = createTestConfig({
        locales,
        strategy: 'prefix_except_default',
        defaultLocale: 'en',
        compactRoutes: true,
        includeUnprefixedFallback: true,
      })
      const result = localizeRoutes(routes, config)

      expect(result.find(r => r.path === '/:locale(fr|ja)/about')).toBeDefined()
      expect(findRoute(result, 'about___fr')).toBeUndefined()
      expect(findRoute(result, 'about___ja')).toBeUndefined()
    })

    it('compacts under prefix_and_default + includeUnprefixedFallback: true', () => {
      const config = createTestConfig({
        locales,
        strategy: 'prefix_and_default',
        defaultLocale: 'en',
        compactRoutes: true,
        includeUnprefixedFallback: true,
      })
      const result = localizeRoutes(routes, config)

      expect(result.find(r => r.path === '/:locale(en|fr|ja)/about')).toBeDefined()
      expect(findRoute(result, 'about___fr')).toBeUndefined()
      expect(findRoute(result, 'about___ja')).toBeUndefined()
    })

    it('still blocks compaction under prefix + includeUnprefixedFallback: true', () => {
      const config = createTestConfig({
        locales,
        strategy: 'prefix',
        defaultLocale: 'en',
        compactRoutes: true,
        includeUnprefixedFallback: true,
      })
      const result = localizeRoutes(routes, config)

      expect(result.find(r => r.path?.includes(':locale'))).toBeUndefined()
    })
  })

  describe('ineligible routes — must stay per-locale', () => {
    it('does NOT compact a route with custom per-locale paths', () => {
      const resolver = createMockOptionsResolver({
        about: { locales, paths: { fr: '/a-propos' } },
      })
      const config = createTestConfig({ locales, strategy: 'prefix', defaultLocale: 'en', optionsResolver: resolver, compactRoutes: true })
      const result = localizeRoutes([{ path: '/about', name: 'about' }], config)

      expect(findRoute(result, 'about___en')).toBeDefined()
      expect(findRoute(result, 'about___fr')).toBeDefined()
      expect(findRoute(result, 'about___ja')).toBeDefined()
      expect(result.find(r => r.path?.includes(':locale'))).toBeUndefined()
    })

    it('does NOT compact a route available for a locale subset', () => {
      const resolver = createMockOptionsResolver({
        about: { locales: ['fr', 'ja'], paths: {} },
      })
      const config = createTestConfig({ locales, strategy: 'prefix', defaultLocale: 'en', optionsResolver: resolver, compactRoutes: true })
      const result = localizeRoutes([{ path: '/about', name: 'about' }], config)

      expect(findRoute(result, 'about___fr')).toBeDefined()
      expect(findRoute(result, 'about___ja')).toBeDefined()
      expect(findRoute(result, 'about___en')).toBeUndefined()
      expect(result.find(r => r.path?.includes(':locale'))).toBeUndefined()
    })

    it('does NOT compact a disabled route (resolver returns undefined)', () => {
      const resolver = createMockOptionsResolver({ about: false })
      const config = createTestConfig({ locales, strategy: 'prefix', defaultLocale: 'en', optionsResolver: resolver, compactRoutes: true })
      const result = localizeRoutes([{ path: '/about', name: 'about' }], config)

      // route returned unchanged
      expect(result).toHaveLength(1)
      expect(result[0].path).toBe('/about')
      expect(result[0].name).toBe('about')
    })
  })

  describe('mixed app — some routes compacted, some per-locale', () => {
    it('handles compactable and non-compactable routes in the same call', () => {
      const resolver = createMockOptionsResolver({
        // contact has a custom fr path → not compactable
        contact: { locales, paths: { fr: '/nous-contacter' } },
        // about has no custom paths → compactable
        about: { locales, paths: {} },
      })
      const config = createTestConfig({ locales, strategy: 'prefix', defaultLocale: 'en', optionsResolver: resolver, compactRoutes: true })
      const input: LocalizableRoute[] = [
        { path: '/about', name: 'about' },
        { path: '/contact', name: 'contact' },
      ]
      const result = localizeRoutes(input, config)

      // about → compacted
      expect(result.find(r => r.path === '/:locale(en|fr|ja)/about')).toBeDefined()
      expect(findRoute(result, 'about___en')).toBeUndefined()

      // contact → per-locale
      expect(findRoute(result, 'contact___en')).toBeDefined()
      expect(findRoute(result, 'contact___fr')).toBeDefined()
      expect(findRoute(result, 'contact___ja')).toBeDefined()
    })
  })
})

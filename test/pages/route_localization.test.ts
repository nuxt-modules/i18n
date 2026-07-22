import { describe, it, expect } from 'vitest'
import { createRouteResourcesCollector, localizeRoutes } from '../../src/routing'
import { localizeSingleRoute, createRouteContext, canCompactRoute } from '../../src/kit/gen'
import { collectCompactPrerenderRoutes, collectRouteRulesFromPages, createPureOptionsResolver, NuxtPageAnalyzeContext } from '../../src/pages'
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
// d) createRouteResourcesCollector
// ---------------------------------------------------------------------------

describe('createRouteResourcesCollector', () => {
  function collectResources(routes: LocalizableRoute[], config: ReturnType<typeof createTestConfig>) {
    const collector = createRouteResourcesCollector()
    localizeRoutes(routes, { ...config, onLocalize: collector.collect })
    return collector.toResources()
  }

  it('keeps a route with no custom paths implicit as a localized path', () => {
    const resources = collectResources(
      [{ path: '/about', name: 'about', file: '/pages/about.vue' }],
      createTestConfig({ optionsResolver: createMockOptionsResolver() }),
    )
    expect(resources.localizedPaths).toEqual(['/about'])
    expect(resources.pathToI18nConfig).toEqual({})
    expect(resources.i18nPathToPath).toEqual({})
    expect(resources.disabledPaths).toEqual([])
  })

  it('maps custom paths and inverts them, identity locales stay implicit', () => {
    const resources = collectResources(
      [{ path: '/about', name: 'about', file: '/pages/about.vue' }],
      createTestConfig({
        optionsResolver: createMockOptionsResolver({
          about: { locales: ['en', 'fr'], paths: { fr: '/a-propos' } },
        }),
      }),
    )
    expect(resources.localizedPaths).toEqual(['/about'])
    expect(resources.pathToI18nConfig['/about']).toEqual({ fr: '/a-propos' })
    expect(resources.i18nPathToPath).toEqual({ '/a-propos': '/about' })
  })

  it('drops the plain path when all locales use custom paths', () => {
    const resources = collectResources(
      [{ path: '/history', name: 'history', file: '/pages/history.vue' }],
      createTestConfig({
        optionsResolver: createMockOptionsResolver({
          history: { locales: ['en', 'fr'], paths: { en: '/our-history', fr: '/notre-histoire' } },
        }),
      }),
    )
    expect(resources.localizedPaths).toEqual([])
    expect(resources.pathToI18nConfig['/history']).toEqual({ en: '/our-history', fr: '/notre-histoire' })
    expect(resources.i18nPathToPath).toEqual({ '/our-history': '/history', '/notre-histoire': '/history' })
  })

  it('marks locales without route options as false', () => {
    const resources = collectResources(
      [{ path: '/about', name: 'about', file: '/pages/about.vue' }],
      createTestConfig({
        optionsResolver: createMockOptionsResolver({
          about: { locales: ['en'], paths: {} },
        }),
      }),
    )
    expect(resources.localizedPaths).toEqual(['/about'])
    expect(resources.pathToI18nConfig['/about']).toEqual({ fr: false })
    expect(resources.disabledPaths).toEqual([])
  })

  it('records routes with disabled localization', () => {
    const resources = collectResources(
      [{ path: '/secret', name: 'secret', file: '/pages/secret.vue', meta: { i18n: false } }],
      createTestConfig({ optionsResolver: createMockOptionsResolver({ secret: false }) }),
    )
    expect(resources.localizedPaths).toEqual([])
    expect(resources.pathToI18nConfig).toEqual({})
    expect(resources.disabledPaths).toEqual(['/secret'])
  })

  it('skips redirect-only routes without a file', () => {
    const resources = collectResources(
      [{ path: '/old', name: 'old', redirect: '/new' }],
      createTestConfig({ optionsResolver: createMockOptionsResolver() }),
    )
    expect(resources.localizedPaths).toEqual([])
    expect(resources.disabledPaths).toEqual([])
  })

  it('keys nested children by their full route path', () => {
    const resources = collectResources(
      [
        {
          path: '/account',
          name: 'account',
          file: '/pages/account.vue',
          children: [{ path: 'profile', name: 'account-profile', file: '/pages/account/profile.vue' }],
        },
      ],
      createTestConfig({ optionsResolver: createMockOptionsResolver() }),
    )
    expect(resources.localizedPaths).toEqual(['/account', '/account/profile'])
    expect(resources.pathToI18nConfig).toEqual({})
  })

  it('composes child paths under a custom parent path', () => {
    const resources = collectResources(
      [
        {
          path: '/account',
          name: 'account',
          file: '/pages/account.vue',
          children: [{ path: 'profile', name: 'account-profile', file: '/pages/account/profile.vue' }],
        },
      ],
      createTestConfig({
        optionsResolver: createMockOptionsResolver({
          account: { locales: ['en', 'fr'], paths: { fr: '/compte' } },
        }),
      }),
    )
    expect(resources.pathToI18nConfig['/account/profile']).toEqual({ fr: '/compte/profile' })
    expect(resources.i18nPathToPath['/compte/profile']).toBe('/account/profile')
  })

  it('reports children of compacted routes', () => {
    const resources = collectResources(
      [
        {
          path: '/account',
          name: 'account',
          file: '/pages/account.vue',
          children: [{ path: 'profile', name: 'account-profile', file: '/pages/account/profile.vue' }],
        },
      ],
      createTestConfig({ strategy: 'prefix', compactRoutes: true, optionsResolver: createMockOptionsResolver() }),
    )
    expect(resources.localizedPaths).toEqual(['/account', '/account/profile'])
  })

  it('collects nothing when routes are not localized', () => {
    const resources = collectResources(
      [{ path: '/about', name: 'about', file: '/pages/about.vue' }],
      createTestConfig({ strategy: 'no_prefix', optionsResolver: createMockOptionsResolver() }),
    )
    expect(resources.localizedPaths).toEqual([])
    expect(resources.pathToI18nConfig).toEqual({})
  })
})

// nuxt injects stub pages for `routeRules` redirects, the rules only match unprefixed paths (#3606)
describe.each([false, true])('routeRules redirect stubs (compactRoutes: %s)', (compactRoutes) => {
  const stubFile = '/app/node_modules/nuxt/dist/pages/runtime/component-stub'

  function makeConfig(resolver: ReturnType<typeof createPureOptionsResolver>) {
    return createTestConfig({
      locales: ['en', 'fr'],
      strategy: 'prefix_except_default',
      defaultLocale: 'en',
      optionsResolver: resolver,
      compactRoutes,
    })
  }

  it('passes stubs through unlocalized and keeps them out of route resources', () => {
    const resolver = createPureOptionsResolver(new NuxtPageAnalyzeContext({}), 'en', 'config', stubFile)
    const collector = createRouteResourcesCollector()
    const result = localizeRoutes(
      [
        { path: '/about', name: 'about', file: '/pages/about.vue' },
        { _sync: true, path: '/old-path', file: `${stubFile}.js` },
      ],
      { ...makeConfig(resolver), onLocalize: collector.collect },
    )

    const stubs = result.filter(r => r.path.includes('old-path'))
    expect(stubs).toHaveLength(1)
    expect(stubs[0]!.path).toBe('/old-path')
    expect(result.find(r => r.path === (compactRoutes ? '/:locale(fr)/about' : '/fr/about'))).toBeDefined()

    const resources = collector.toResources()
    expect(resources.localizedPaths).not.toContain('/old-path')
    expect(resources.disabledPaths).not.toContain('/old-path')
  })

  it('does not skip a project page named component-stub', () => {
    const resolver = createPureOptionsResolver(new NuxtPageAnalyzeContext({}), 'en', 'config', stubFile)
    const result = localizeRoutes(
      [{ path: '/runtime/component-stub', name: 'stub-page', file: '/pages/runtime/component-stub.vue' }],
      makeConfig(resolver),
    )
    expect(result.find(r => r.name === 'stub-page___en')).toBeDefined()
    expect(
      result.find(r => r.path === (compactRoutes ? '/:locale(fr)/runtime/component-stub' : '/fr/runtime/component-stub')),
    ).toBeDefined()
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

  // Compact regex routes can't be enumerated by Nuxt's static-route extractor
  // for `nuxt generate`, so we expand them back into concrete per-locale paths
  // via `collectCompactPrerenderRoutes`. These tests pin down the edge cases.
  describe('collectCompactPrerenderRoutes — prerender expansion of compact routes', () => {
    const compact = (path: string, name: string) => ({
      path,
      name,
      meta: { __i18nCompact: true },
    } as unknown as Parameters<typeof collectCompactPrerenderRoutes>[0][number])

    it('expands a compact regex route to one path per locale', () => {
      const out = collectCompactPrerenderRoutes([compact('/:locale(en|fr|ja)/about', 'about')])
      expect(out).toEqual(['/en/about', '/fr/about', '/ja/about'])
    })

    it('handles the root route — `/` becomes `/:locale(...)` with no rest', () => {
      // `prefix` strategy compacts the home page to `/:locale(en|fr)` (no trailing path).
      // We must emit `/en` and `/fr`, never `/en/` or `/fr/`.
      const out = collectCompactPrerenderRoutes([compact('/:locale(en|fr)', 'index')])
      expect(out).toEqual(['/en', '/fr'])
    })

    it('skips routes with dynamic params after the locale segment', () => {
      // `/:locale(fr)/products/:id` — concrete `:id` values are unknown at build time,
      // matches the non-compact case where Nuxt also can't auto-prerender these.
      const out = collectCompactPrerenderRoutes([compact('/:locale(fr|ja)/products/:id', 'products-id')])
      expect(out).toEqual([])
    })

    it('skips routes with optional params after the locale segment', () => {
      const out = collectCompactPrerenderRoutes([compact('/:locale(fr)/blog/:slug?', 'blog-slug')])
      expect(out).toEqual([])
    })

    it('ignores routes without `__i18nCompact` meta', () => {
      const plain = { path: '/about', name: 'about' } as Parameters<typeof collectCompactPrerenderRoutes>[0][number]
      const out = collectCompactPrerenderRoutes([plain])
      expect(out).toEqual([])
    })

    it('ignores routes whose path does not start with the `:locale(...)` regex prefix', () => {
      // Defensive: if a future change marks a non-prefixed route as compact,
      // we should not emit garbage like `undefinedabout`.
      const odd = compact('/about', 'about')
      const out = collectCompactPrerenderRoutes([odd])
      expect(out).toEqual([])
    })

    it('mixes compactable and non-compactable routes in the same call', () => {
      const out = collectCompactPrerenderRoutes([
        compact('/:locale(fr|ja)/about', 'about'),
        // per-locale (not compacted) — already enumerable, must not be added
        { path: '/contact', name: 'contact___en' } as Parameters<typeof collectCompactPrerenderRoutes>[0][number],
        compact('/:locale(fr|ja)/help', 'help'),
        // dynamic — skipped
        compact('/:locale(fr|ja)/users/:id', 'users-id'),
      ])
      expect(out).toEqual(['/fr/about', '/ja/about', '/fr/help', '/ja/help'])
    })

    const compactWithChildren = (
      path: string,
      name: string,
      children: { path: string, name?: string, children?: unknown[] }[],
    ) => ({
      path,
      name,
      meta: { __i18nCompact: true },
      children,
    } as unknown as Parameters<typeof collectCompactPrerenderRoutes>[0][number])

    it('expands static children of a compact parent', () => {
      const out = collectCompactPrerenderRoutes([
        compactWithChildren('/:locale(en|fr)/parent', 'parent', [
          { path: 'child', name: 'parent-child' },
        ]),
      ])
      expect(out).toEqual(['/en/parent', '/fr/parent', '/en/parent/child', '/fr/parent/child'])
    })

    it('walks deeply-nested static children', () => {
      const out = collectCompactPrerenderRoutes([
        compactWithChildren('/:locale(en|fr)/a', 'a', [
          { path: 'b', name: 'a-b', children: [{ path: 'c', name: 'a-b-c' }] },
        ]),
      ])
      expect(out).toEqual(['/en/a', '/fr/a', '/en/a/b', '/fr/a/b', '/en/a/b/c', '/fr/a/b/c'])
    })

    it('skips dynamic children but keeps static siblings', () => {
      const out = collectCompactPrerenderRoutes([
        compactWithChildren('/:locale(en|fr)/users', 'users', [
          { path: '', name: 'users-index' },
          { path: ':id', name: 'users-id' },
          { path: 'list', name: 'users-list' },
        ]),
      ])
      expect(out).toEqual(['/en/users', '/fr/users', '/en/users/list', '/fr/users/list'])
    })

    it('does not descend past a dynamic child (grandchildren are unreachable too)', () => {
      const out = collectCompactPrerenderRoutes([
        compactWithChildren('/:locale(en|fr)/users', 'users', [
          { path: ':id', name: 'users-id', children: [{ path: 'profile', name: 'users-id-profile' }] },
        ]),
      ])
      expect(out).toEqual(['/en/users', '/fr/users'])
    })

    it('treats an empty-path index child as the parent URL and walks its grandchildren', () => {
      const out = collectCompactPrerenderRoutes([
        compactWithChildren('/:locale(en|fr)', 'index', [
          { path: '', name: 'index-root', children: [{ path: 'nested', name: 'index-nested' }] },
        ]),
      ])
      expect(out).toEqual(['/en', '/fr', '/en/nested', '/fr/nested'])
    })

    it('ignores absolute child paths (they are not compacted descendants)', () => {
      const out = collectCompactPrerenderRoutes([
        compactWithChildren('/:locale(en|fr)/parent', 'parent', [
          { path: '/absolute', name: 'absolute' },
          { path: 'relative', name: 'parent-relative' },
        ]),
      ])
      expect(out).toEqual(['/en/parent', '/fr/parent', '/en/parent/relative', '/fr/parent/relative'])
    })
  })

  // Nuxt maps rules on compact `/:locale(...)` paths to a `/**` rule (nuxt#35455),
  // `collectRouteRulesFromPages` consumes them first and expands per locale instead.
  describe('collectRouteRulesFromPages — inline route rules on compact routes', () => {
    type RulesPage = Parameters<typeof collectRouteRulesFromPages>[0][number]
    const page = (path: string, rules?: Record<string, unknown>, children?: RulesPage[]) =>
      ({ path, rules, children } as RulesPage)

    it('expands a compact route to one rule per locale', () => {
      const pages = [page('/:locale(en|fr)/account', { prerender: true })]
      expect(collectRouteRulesFromPages(pages)).toEqual({
        '/en/account': { prerender: true },
        '/fr/account': { prerender: true },
      })
    })

    it('handles the root route — `/:locale(...)` with no rest', () => {
      const pages = [page('/:locale(en|fr)', { swr: 60 })]
      expect(collectRouteRulesFromPages(pages)).toEqual({
        '/en': { swr: 60 },
        '/fr': { swr: 60 },
      })
    })

    it('converts non-compact paths like nuxt does', () => {
      const pages = [page('/about', { prerender: true }), page('/blog/:slug', { swr: 60 })]
      expect(collectRouteRulesFromPages(pages)).toEqual({
        '/about': { prerender: true },
        '/blog/**': { swr: 60 },
      })
    })

    it('converts a dynamic tail after the locale segment to a per-locale glob', () => {
      // nuxt drops this path entirely (two dynamic params), expansion makes it representable
      const pages = [page('/:locale(en|fr)/blog/:slug', { swr: 60 })]
      expect(collectRouteRulesFromPages(pages)).toEqual({
        '/en/blog/**': { swr: 60 },
        '/fr/blog/**': { swr: 60 },
      })
    })

    it('skips paths with multiple dynamic params after expansion', () => {
      const pages = [page('/:locale(en|fr)/:foo/:bar', { swr: 60 })]
      expect(collectRouteRulesFromPages(pages)).toEqual({})
      expect(pages[0]!.rules).toBeUndefined()
    })

    it('collects rules from children of a compact parent', () => {
      const pages = [
        page('/:locale(en|fr)/parent', undefined, [page('child', { prerender: true })]),
      ]
      expect(collectRouteRulesFromPages(pages)).toEqual({
        '/en/parent/child': { prerender: true },
        '/fr/parent/child': { prerender: true },
      })
    })

    it('removes rules from the pages, including empty rules', () => {
      const pages = [page('/:locale(en|fr)/account', { prerender: true }), page('/about', {})]
      collectRouteRulesFromPages(pages)
      expect(pages[0]!.rules).toBeUndefined()
      expect(pages[1]!.rules).toBeUndefined()
    })

    it('collects expanded and plain rules across localized routes', () => {
      const config = createTestConfig({ locales, strategy: 'prefix_except_default', defaultLocale: 'en', compactRoutes: true })
      const input: LocalizableRoute[] = [{ path: '/about', name: 'about', rules: { prerender: true } } as LocalizableRoute]
      const result = localizeRoutes(input, config)

      expect(collectRouteRulesFromPages(result as Parameters<typeof collectRouteRulesFromPages>[0])).toEqual({
        '/about': { prerender: true },
        '/fr/about': { prerender: true },
        '/ja/about': { prerender: true },
      })
      expect(result.every(r => (r as { rules?: unknown }).rules === undefined)).toBe(true)
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

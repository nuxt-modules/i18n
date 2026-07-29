import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { getNormalizedLocales, getNuxtOptions } from './utils'
import { localizeRoutes, shouldLocalizeRoutes } from '../../src/routing'
import { setupMultiDomainLocales } from '../../src/runtime/routing/domain'
import type { NuxtPage } from '@nuxt/schema'
import type { LocaleObject } from '../../src/types'
import { LocalizableRoute } from '../../src/kit/gen'

const nuxtOptions = getNuxtOptions({})
nuxtOptions.locales = nuxtOptions.locales?.filter(x => (x as LocaleObject).code !== 'fr') as LocaleObject[]
delete nuxtOptions.defaultLocale
describe('localizeRoutes', function () {
  describe('basic', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const locales = getNormalizedLocales(['en', 'ja'])
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], { ...nuxtOptions, locales })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(4)
      locales.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale.code}${route.path === '/' ? '' : route.path}`,
            name: `${route.name}${nuxtOptions.routesNameSeparator}${locale.code}`
          })
        })
      })
    })
  })

  describe('has children', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/user/:id',
          name: 'user',
          children: [
            {
              path: 'profile',
              name: 'user-profile'
            },
            {
              path: 'posts',
              name: 'user-posts'
            }
          ]
        }
      ]
      const children: NuxtPage[] = routes[0].children as NuxtPage[]

      const locales = getNormalizedLocales(['en', 'ja'])
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], { ...nuxtOptions, locales })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(2)
      locales.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale.code}${route.path === '/' ? '' : route.path}`,
            name: `${route.name}${nuxtOptions.routesNameSeparator}${locale.code}`,
            children: children.map(child => ({
              path: child.path,
              name: `${child.name}${nuxtOptions.routesNameSeparator}${locale.code}`
            }))
          })
        })
      })
    })
  })

  describe('trailing slash', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const locales = getNormalizedLocales(['en', 'ja'])
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        locales,
        trailingSlash: true
      })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(4)
      locales.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale.code}${route.path === '/' ? '' : route.path}/`,
            name: `${route.name}${nuxtOptions.routesNameSeparator}${locale.code}`
          })
        })
      })
    })
  })

  describe('route name separator', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const locales = getNormalizedLocales(['en', 'ja'])
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        locales,
        routesNameSeparator: '__'
      })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(4)
      locales.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale.code}${route.path === '/' ? '' : route.path}`,
            name: `${route.name}${'__'}${locale.code}`
          })
        })
      })
    })
  })

  describe('strategy: "prefix_and_default"', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        },
        {
          path: '/user/:id',
          name: 'user',
          children: [
            {
              path: 'profile',
              name: 'user-profile'
            },
            {
              path: 'posts',
              name: 'user-posts'
            }
          ]
        }
      ]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_and_default',
        locales: getNormalizedLocales(['en', 'ja'])
      })

      expect(localizedRoutes).toMatchSnapshot()
    })
  })

  // low confidence test
  describe('strategy: "prefix_and_default" + multiDomainLocales', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        },
        {
          path: '/user/:id',
          name: 'user',
          children: [
            {
              path: 'profile',
              name: 'user-profile'
            },
            {
              path: 'posts',
              name: 'user-posts'
            }
          ]
        }
      ]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        multiDomainLocales: true,
        locales: getNormalizedLocales([
          { code: 'en', iso: 'en-US', domainDefault: true },
          { code: 'ja', iso: 'ja-JP' }
        ])
      })

      const router = createRouter({ routes: localizedRoutes as any, history: createMemoryHistory() })
      expect(router.getRoutes().map(x => ({ name: x.name, path: x.path, children: x.children }))).toMatchSnapshot()
      setupMultiDomainLocales('en', 'prefix_except_default', router)

      expect(router.getRoutes().map(x => ({ name: x.name, path: x.path, children: x.children }))).toMatchSnapshot()
    })
  })

  describe('strategy: "prefix_except_default" + differentDomains', function () {
    it('generates unprefixed routes for domain default locales in both option shapes', function () {
      const routes: NuxtPage[] = [{ path: '/about', name: 'about' }]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        differentDomains: true,
        locales: getNormalizedLocales([
          { code: 'en', domain: 'en.example.com' },
          { code: 'ja', domain: 'ja.example.com' },
          // unnormalized single-domain form
          { code: 'fr', domain: 'fr.example.com', domainDefault: true },
          // multi-domain form
          { code: 'nl', domains: ['nl.example.com'], defaultForDomains: ['nl.example.com'] }
        ])
      })

      const paths = Object.fromEntries(localizedRoutes.map(x => [x.name, x.path]))
      // every locale is prefixed, `defaultLocale` is not the default on every domain
      expect(paths['about___en']).toBe('/en/about')
      expect(paths['about___ja']).toBe('/ja/about')
      // domain defaults are prefixed with an unprefixed `___default` variant
      expect(paths['about___fr']).toBe('/fr/about')
      expect(paths['about___fr___default']).toBe('/about')
      expect(paths['about___nl']).toBe('/nl/about')
      expect(paths['about___nl___default']).toBe('/about')

      // the runtime surgery unprefixes the domain's default locale
      const router = createRouter({ routes: localizedRoutes as any, history: createMemoryHistory() })
      setupMultiDomainLocales('fr', 'prefix_except_default', router)
      const domainPaths = Object.fromEntries(router.getRoutes().map(x => [x.name, x.path]))
      expect(domainPaths['about___fr']).toBe('/about')
      expect(domainPaths['about___nl']).toBe('/nl/about')
      expect(domainPaths['about___fr___default']).toBeUndefined()
      expect(domainPaths['about___nl___default']).toBeUndefined()
      // `en` keeps its prefix here, it is only unprefixed on the domains it is the default for
      expect(domainPaths['about___en']).toBe('/en/about')
    })

    it('unprefixes the domain default without breaking nested routes', function () {
      const routes: NuxtPage[] = [
        { path: '/', name: 'home' },
        { path: '/user/:id', name: 'user', children: [{ path: 'profile', name: 'user-profile' }] }
      ]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        differentDomains: true,
        locales: getNormalizedLocales([
          { code: 'en', domain: 'en.example.com' },
          { code: 'fr', domain: 'fr.example.com', defaultForDomains: ['fr.example.com'] }
        ])
      })

      const router = createRouter({ routes: localizedRoutes as any, history: createMemoryHistory() })
      setupMultiDomainLocales('fr', 'prefix_except_default', router)

      expect(router.resolve('/').name).toBe('home___fr')
      expect(router.resolve('/en').name).toBe('home___en')
      // the re-added child is registered under its parent, not as a route of its own
      const profile = router.resolve('/user/1/profile')
      expect(profile.name).toBe('user-profile___fr')
      expect(profile.matched.map(x => x.name)).toEqual(['user___fr', 'user-profile___fr'])
      expect(router.resolve('/en/user/1/profile').name).toBe('user-profile___en')
    })

    it('keeps the configured trailing slash when unprefixing', function () {
      const routes: NuxtPage[] = [{ path: '/', name: 'home' }, { path: '/about', name: 'about' }]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        trailingSlash: true,
        differentDomains: true,
        locales: getNormalizedLocales([
          { code: 'en', domain: 'en.example.com' },
          { code: 'fr', domain: 'fr.example.com', defaultForDomains: ['fr.example.com'] }
        ])
      })

      const router = createRouter({ routes: localizedRoutes as any, history: createMemoryHistory() })
      setupMultiDomainLocales('fr', 'prefix_except_default', router)
      const domainPaths = Object.fromEntries(router.getRoutes().map(x => [x.name, x.path]))
      expect(domainPaths['home___fr']).toBe('/')
      expect(domainPaths['home___en']).toBe('/en/')
      expect(domainPaths['about___en']).toBe('/en/about/')
    })

    it('localizes the children of a domain default\'s unprefixed variant', function () {
      const routes: NuxtPage[] = [
        { path: '/user/:id', name: 'user', children: [{ path: 'profile', name: 'user-profile' }] }
      ]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        differentDomains: true,
        locales: getNormalizedLocales([
          { code: 'en', domain: 'en.example.com' },
          { code: 'fr', domain: 'fr.example.com', defaultForDomains: ['fr.example.com'] }
        ])
      })

      const tree = localizedRoutes.find(r => r.name === 'user___fr___default')
      expect(tree?.children?.map(c => c.name)).toEqual(['user-profile___fr___default'])
    })
  })

  describe('shouldLocalizeRoutes', function () {
    it('rejects `no_prefix` with locales sharing a domain, in either option shape', function () {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})
      const shared = 'shared.example.com'

      expect(
        shouldLocalizeRoutes({
          ...nuxtOptions,
          strategy: 'no_prefix',
          differentDomains: true,
          locales: getNormalizedLocales([{ code: 'en', domain: shared }, { code: 'fr', domain: shared }])
        })
      ).toBe(false)

      expect(
        shouldLocalizeRoutes({
          ...nuxtOptions,
          strategy: 'no_prefix',
          differentDomains: true,
          locales: getNormalizedLocales([{ code: 'en', domains: [shared] }, { code: 'fr', domains: [shared] }])
        })
      ).toBe(false)

      expect(err).toHaveBeenCalledTimes(2)
      err.mockRestore()
    })

    it('allows one locale to serve several domains', function () {
      expect(
        shouldLocalizeRoutes({
          ...nuxtOptions,
          strategy: 'no_prefix',
          differentDomains: true,
          locales: getNormalizedLocales([{ code: 'en', domains: ['a.example.com', 'b.example.com'] }, { code: 'fr', domain: 'c.example.com' }])
        })
      ).toBe(true)
    })

    it('accepts `no_prefix` under `multiDomainLocales` when each locale has its own domain', function () {
      // the locale data decides, not which option turned domains on
      expect(
        shouldLocalizeRoutes({
          ...nuxtOptions,
          strategy: 'no_prefix',
          multiDomainLocales: true,
          locales: getNormalizedLocales([
            { code: 'en', domains: ['en.example.com'] },
            { code: 'fr', domains: ['fr.example.com'] }
          ])
        })
      ).toBe(true)
    })

    it('rejects `no_prefix` without any domain, so a plain site keeps unlocalized routes', function () {
      expect(
        shouldLocalizeRoutes({ ...nuxtOptions, strategy: 'no_prefix', locales: getNormalizedLocales(['en', 'fr']) })
      ).toBe(false)
      // domains alone qualify, with neither option set (the v11 direction)
      expect(
        shouldLocalizeRoutes({
          ...nuxtOptions,
          strategy: 'no_prefix',
          locales: getNormalizedLocales([{ code: 'en', domains: ['en.example.com'] }, { code: 'fr', domains: ['fr.example.com'] }])
        })
      ).toBe(true)
    })
  })

  it('does not generate an unprefixed variant for `domainDefault` without a domain', function () {
    const localizedRoutes = localizeRoutes([{ path: '/about', name: 'about' }] as LocalizableRoute[], {
      ...nuxtOptions,
      defaultLocale: '',
      strategy: 'prefix_except_default',
      differentDomains: true,
      locales: getNormalizedLocales([{ code: 'en', domainDefault: true }, { code: 'fr', domain: 'fr.example.com', domainDefault: true }])
    })

    const names = localizedRoutes.map(x => x.name)
    // `fr` has a domain to be the default for, `en` has none and the runtime resolves no default for it
    expect(names).toContain('about___fr___default')
    expect(names).not.toContain('about___en___default')
  })

  describe('strategy: "prefix_and_default" + differentDomains', function () {
    it('only generates an unprefixed variant for domain defaults, not for `defaultLocale`', function () {
      const routes: NuxtPage[] = [{ path: '/about', name: 'about' }]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_and_default',
        differentDomains: true,
        locales: getNormalizedLocales([
          { code: 'en', domain: 'en.example.com' },
          { code: 'fr', domain: 'fr.example.com', defaultForDomains: ['fr.example.com'] }
        ])
      })

      const paths = Object.fromEntries(localizedRoutes.map(x => [x.name, x.path]))
      expect(paths['about___en']).toBe('/en/about')
      expect(paths['about___en___default']).toBeUndefined()
      expect(paths['about___fr']).toBe('/fr/about')
      expect(paths['about___fr___default']).toBe('/about')

      const router = createRouter({ routes: localizedRoutes as any, history: createMemoryHistory() })
      setupMultiDomainLocales('fr', 'prefix_and_default', router)
      const domainPaths = Object.fromEntries(router.getRoutes().map(x => [x.name, x.path]))
      // the host default keeps both variants, `prefix_and_default` serves it either way
      expect(domainPaths['about___fr___default']).toBe('/about')
      expect(domainPaths['about___fr']).toBe('/fr/about')
      expect(domainPaths['about___en']).toBe('/en/about')
      expect(domainPaths['about___en___default']).toBeUndefined()
    })

    it('unprefixes the fallback default locale on a host matching no configured domain', function () {
      const routes: NuxtPage[] = [{ path: '/about', name: 'about' }]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_and_default',
        multiDomainLocales: true,
        locales: getNormalizedLocales([
          // `en` is served everywhere but is the default for no domain
          { code: 'en', domains: ['a.example.com', 'b.example.com'] },
          { code: 'fr', domains: ['a.example.com'], defaultForDomains: ['a.example.com'] }
        ])
      })

      const router = createRouter({ routes: localizedRoutes as any, history: createMemoryHistory() })
      // an unmatched host falls back to the configured `defaultLocale`, which has no variant to keep
      setupMultiDomainLocales('en', 'prefix_and_default', router)
      const domainPaths = Object.fromEntries(router.getRoutes().map(x => [x.name, x.path]))
      expect(domainPaths['about___en']).toBe('/about')
      expect(domainPaths['about___fr___default']).toBeUndefined()
    })
  })

  describe('strategy: "prefix_except_default"', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        locales: getNormalizedLocales(localeCodes)
      })

      expect(localizedRoutes).toMatchSnapshot()
    })
  })

  describe('strategy: "prefix"', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix',
        locales: getNormalizedLocales(['en', 'ja']),
      })

      expect(localizedRoutes).toMatchSnapshot()
    })
  })

  describe('strategy: "no_prefix"', function () {
    it('should be localized routing', function () {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'no_prefix',
        locales: getNormalizedLocales(['en', 'ja'])
      })

      expect(localizedRoutes).toMatchSnapshot()
    })

    it('(#4064) detects duplicate domains regardless of protocol', function () {
      const routes: NuxtPage[] = [{ path: '/', name: 'home' }]
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'no_prefix',
        differentDomains: true,
        locales: getNormalizedLocales([
          { code: 'en', domain: 'https://example.com' },
          { code: 'ja', domain: 'example.com' }
        ])
      })

      // localization is skipped for multiple locales on the same domain
      expect(localizedRoutes).toEqual(routes)
    })
  })

  describe('Route options resolver: routing disable', () => {
    it('should be disabled routing', () => {
      const routes: NuxtPage[] = [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/about',
          name: 'about'
        }
      ]
      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        locales: getNormalizedLocales(['en', 'ja']),
        optionsResolver: () => undefined
      })

      expect(localizedRoutes).toMatchSnapshot()
    })
  })
})

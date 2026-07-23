import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { getNormalizedLocales, getNuxtOptions } from './utils'
import { localizeRoutes } from '../../src/routing'
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
        locales: [
          { code: 'en', iso: 'en-US', domainDefault: true },
          { code: 'ja', iso: 'ja-JP' }
        ]
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
        locales: [
          { code: 'en', domain: 'en.example.com' },
          { code: 'ja', domain: 'ja.example.com' },
          // unnormalized single-domain form
          { code: 'fr', domain: 'fr.example.com', domainDefault: true },
          // multi-domain form
          { code: 'nl', domains: ['nl.example.com'], defaultForDomains: ['nl.example.com'] }
        ]
      })

      const paths = Object.fromEntries(localizedRoutes.map(x => [x.name, x.path]))
      expect(paths['about___en']).toBe('/about')
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

    it('refuses localization for locales sharing a host, compared without protocol', function () {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const routes: NuxtPage[] = [{ path: '/about', name: 'about' }]

      const localizedRoutes = localizeRoutes(routes as LocalizableRoute[], {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'no_prefix',
        differentDomains: true,
        locales: [
          { code: 'en', domain: 'https://shared.example.com' },
          { code: 'ja', domain: 'shared.example.com' }
        ]
      })

      expect(localizedRoutes).toEqual(routes)
      expect(errorSpy).toHaveBeenCalledOnce()
      errorSpy.mockRestore()
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

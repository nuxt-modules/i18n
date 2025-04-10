import { describe, it, expect } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { getNuxtOptions } from './utils'
import { localizeRoutes } from '../../src/routing'
import { getNormalizedLocales } from '../../src/utils'
import { setupMultiDomainLocales } from '../../src/runtime/domain'
import type { NuxtPage } from '@nuxt/schema'
import type { LocaleObject } from '../../src/types'

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
      const localizedRoutes = localizeRoutes(routes, { ...nuxtOptions, locales })

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
      const localizedRoutes = localizeRoutes(routes, { ...nuxtOptions, locales })

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
      const localizedRoutes = localizeRoutes(routes, { ...nuxtOptions, locales, trailingSlash: true })

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
      const localizedRoutes = localizeRoutes(routes, {
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

      const localizedRoutes = localizeRoutes(routes, {
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

      const localizedRoutes = localizeRoutes(routes, {
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
      setupMultiDomainLocales(
        {
          multiDomainLocales: true,
          strategy: 'prefix_except_default',
          routesNameSeparator: '___',
          defaultLocaleRouteNameSuffix: 'default'
        },
        'en',
        router
      )

      expect(router.getRoutes().map(x => ({ name: x.name, path: x.path, children: x.children }))).toMatchSnapshot()
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
      const localizedRoutes = localizeRoutes(routes, {
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
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix',
        locales: getNormalizedLocales(['en', 'ja']),
        includeUnprefixedFallback: true
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
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'no_prefix',
        locales: getNormalizedLocales(['en', 'ja'])
      })

      expect(localizedRoutes).toMatchSnapshot()
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
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        locales: getNormalizedLocales(['en', 'ja']),
        optionsResolver: () => undefined
      })

      expect(localizedRoutes).toMatchSnapshot()
    })
  })
})

import { describe, it, expect } from 'vitest'

import { localizeRoutes } from '../../src/routing'
import { getNuxtOptions } from './utils'

import type { NuxtPage } from '@nuxt/schema'
import type { LocaleObject } from 'vue-i18n-routing'

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
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, { ...nuxtOptions, locales: localeCodes })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(4)
      localeCodes.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale}${route.path === '/' ? '' : route.path}`,
            name: `${route.name}${nuxtOptions.routesNameSeparator}${locale}`
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

      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, { ...nuxtOptions, locales: localeCodes })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(2)
      localeCodes.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale}${route.path === '/' ? '' : route.path}`,
            name: `${route.name}${nuxtOptions.routesNameSeparator}${locale}`,
            children: children.map(child => ({
              path: child.path,
              name: `${child.name}${nuxtOptions.routesNameSeparator}${locale}`
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
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, { ...nuxtOptions, locales: localeCodes, trailingSlash: true })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(4)
      localeCodes.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale}${route.path === '/' ? '' : route.path}/`,
            name: `${route.name}${nuxtOptions.routesNameSeparator}${locale}`
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
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        locales: localeCodes,
        routesNameSeparator: '__'
      })

      expect(localizedRoutes).toMatchSnapshot()
      expect(localizedRoutes.length).to.equal(4)
      localeCodes.forEach(locale => {
        routes.forEach(route => {
          expect(localizedRoutes).to.deep.include({
            path: `/${locale}${route.path === '/' ? '' : route.path}`,
            name: `${route.name}${'__'}${locale}`
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

      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix_and_default',
        locales: localeCodes
      })

      expect(localizedRoutes).toMatchSnapshot()
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
        locales: localeCodes
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
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'prefix',
        locales: localeCodes,
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
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        defaultLocale: 'en',
        strategy: 'no_prefix',
        locales: localeCodes
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
      const localeCodes = ['en', 'ja']
      const localizedRoutes = localizeRoutes(routes, {
        ...nuxtOptions,
        locales: localeCodes,
        optionsResolver: () => undefined
      })

      expect(localizedRoutes).toMatchSnapshot()
    })
  })
})

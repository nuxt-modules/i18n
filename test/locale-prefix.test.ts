import { describe, it, expect } from 'vitest'
import { localizeRoutes } from '../src/routing'
import type { LocaleObject } from '../src/types'
import type { LocalizableRoute } from '../src/kit/gen'

const baseOptions = {
  strategy: 'prefix' as const,
  trailingSlash: false,
  routesNameSeparator: '___',
  defaultLocaleRouteNameSuffix: 'default'
}

describe('custom locale prefix', () => {
  describe('basic functionality', () => {
    it('should use custom prefix when defined', () => {
      const routes: LocalizableRoute[] = [
        { path: '/', name: 'index' },
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'en', language: 'en-US' },
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      // Should have routes with /en and /brazil prefixes
      expect(localizedRoutes.some(r => r.path === '/en')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/en/about')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/brazil')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/brazil/about')).toBe(true)

      // Should NOT have routes with /pt-BR prefix
      expect(localizedRoutes.some(r => r.path === '/pt-BR')).toBe(false)
      expect(localizedRoutes.some(r => r.path === '/pt-BR/about')).toBe(false)
    })

    it('should use locale code when prefix is not defined', () => {
      const routes: LocalizableRoute[] = [
        { path: '/', name: 'index' }
      ]
      const locales: LocaleObject[] = [
        { code: 'en', language: 'en-US' },
        { code: 'ja', language: 'ja-JP' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      expect(localizedRoutes.some(r => r.path === '/en')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/ja')).toBe(true)
    })

    it('should preserve route name with locale code (not prefix)', () => {
      const routes: LocalizableRoute[] = [
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      // Route name should still use the locale code, not the prefix
      expect(localizedRoutes.some(r => r.name === 'about___pt-BR')).toBe(true)
      expect(localizedRoutes.some(r => r.name === 'about___brazil')).toBe(false)
    })
  })

  describe('with different strategies', () => {
    it('should work with prefix_except_default strategy', () => {
      const routes: LocalizableRoute[] = [
        { path: '/', name: 'index' },
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'en', language: 'en-US' },
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, {
        ...baseOptions,
        strategy: 'prefix_except_default',
        defaultLocale: 'en',
        locales
      })

      // Default locale (en) should not have prefix
      expect(localizedRoutes.some(r => r.path === '/' && r.name === 'index___en')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/about' && r.name === 'about___en')).toBe(true)

      // pt-BR should use custom prefix 'brazil'
      expect(localizedRoutes.some(r => r.path === '/brazil')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/brazil/about')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/pt-BR')).toBe(false)
    })

    it('should work with prefix_and_default strategy', () => {
      const routes: LocalizableRoute[] = [
        { path: '/', name: 'index' }
      ]
      const locales: LocaleObject[] = [
        { code: 'en', language: 'en-US', prefix: 'us' },
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, {
        ...baseOptions,
        strategy: 'prefix_and_default',
        defaultLocale: 'en',
        locales
      })

      // Should have both unprefixed and prefixed routes for default locale
      expect(localizedRoutes.some(r => r.path === '/')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/us')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/brazil')).toBe(true)

      // Should NOT have routes with locale codes as prefix
      expect(localizedRoutes.some(r => r.path === '/en')).toBe(false)
      expect(localizedRoutes.some(r => r.path === '/pt-BR')).toBe(false)
    })
  })

  describe('with children routes', () => {
    it('should apply custom prefix to parent and children routes', () => {
      const routes: LocalizableRoute[] = [
        {
          path: '/user/:id',
          name: 'user',
          children: [
            { path: 'profile', name: 'user-profile' },
            { path: 'settings', name: 'user-settings' }
          ]
        }
      ]
      const locales: LocaleObject[] = [
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      // Parent route should use custom prefix
      const userRoute = localizedRoutes.find(r => r.name === 'user___pt-BR')
      expect(userRoute).toBeDefined()
      expect(userRoute?.path).toBe('/brazil/user/:id')

      // Children should have correct names
      expect(userRoute?.children?.some(c => c.name === 'user-profile___pt-BR')).toBe(true)
      expect(userRoute?.children?.some(c => c.name === 'user-settings___pt-BR')).toBe(true)
    })
  })

  describe('with aliases', () => {
    it('should apply custom prefix to route aliases', () => {
      const routes: LocalizableRoute[] = [
        {
          path: '/about',
          name: 'about',
          alias: ['/about-us', '/info']
        }
      ]
      const locales: LocaleObject[] = [
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      const aboutRoute = localizedRoutes.find(r => r.name === 'about___pt-BR')
      expect(aboutRoute).toBeDefined()
      expect(aboutRoute?.path).toBe('/brazil/about')
      expect(aboutRoute?.alias).toContain('/brazil/about-us')
      expect(aboutRoute?.alias).toContain('/brazil/info')
    })
  })

  describe('with trailing slash', () => {
    it('should apply trailing slash with custom prefix', () => {
      const routes: LocalizableRoute[] = [
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }
      ]

      const localizedRoutes = localizeRoutes(routes, {
        ...baseOptions,
        trailingSlash: true,
        locales
      })

      expect(localizedRoutes.some(r => r.path === '/brazil/about/')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty prefix as using locale code', () => {
      const routes: LocalizableRoute[] = [
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'pt-BR', language: 'pt-BR', prefix: '' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      // Empty prefix should fallback to locale code
      expect(localizedRoutes.some(r => r.path === '/pt-BR/about')).toBe(true)
    })

    it('should handle prefix with special characters', () => {
      const routes: LocalizableRoute[] = [
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'pt-BR', language: 'pt-BR', prefix: 'br' }
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      expect(localizedRoutes.some(r => r.path === '/br/about')).toBe(true)
    })

    it('should handle multiple locales with mixed prefix configurations', () => {
      const routes: LocalizableRoute[] = [
        { path: '/about', name: 'about' }
      ]
      const locales: LocaleObject[] = [
        { code: 'en', language: 'en-US' }, // no custom prefix
        { code: 'pt-BR', language: 'pt-BR', prefix: 'brazil' }, // custom prefix
        { code: 'es-MX', language: 'es-MX', prefix: 'mexico' } // custom prefix
      ]

      const localizedRoutes = localizeRoutes(routes, { ...baseOptions, locales })

      expect(localizedRoutes.some(r => r.path === '/en/about')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/brazil/about')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/mexico/about')).toBe(true)
      expect(localizedRoutes.some(r => r.path === '/pt-BR/about')).toBe(false)
      expect(localizedRoutes.some(r => r.path === '/es-MX/about')).toBe(false)
    })
  })
})

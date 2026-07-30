import { describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createLocalizedRouteByPathResolver } from '../src/runtime/routing/utils'
import { localizeRoutes } from '../src/routing'
import { getNormalizedLocales } from './pages/utils'
import type { LocalizableRoute } from '../src/kit/gen'
import type { Strategies } from '#internal-i18n-types'

// normalized the way `resolveContext` does - `localizeRoutes` reads the domain fields
const LOCALES = getNormalizedLocales([{ code: 'en', language: 'en' }, { code: 'ja', language: 'ja' }])
const PAGES = [
  { path: '/', name: 'index' },
  { path: '/about', name: 'about' },
  { path: '/user/:id', name: 'user', children: [{ path: 'profile', name: 'user-profile' }] }
]

function createResolver(strategy: Strategies) {
  const localized = localizeRoutes(PAGES as LocalizableRoute[], {
    strategy,
    defaultLocale: 'en',
    locales: LOCALES,
    routesNameSeparator: '___',
    defaultLocaleRouteNameSuffix: 'default',
    trailingSlash: false
  })
  const router = createRouter({ routes: localized as never, history: createMemoryHistory() })
  const resolve = createLocalizedRouteByPathResolver(router, {
    strategy,
    routing: strategy !== 'no_prefix',
    domains: false
  })
  return { router, resolve }
}

describe.each(['prefix', 'prefix_except_default', 'prefix_and_default'] as const)(
  'createLocalizedRouteByPathResolver (strategy: %s)',
  strategy => {
    test('resolves an unprefixed path for a non-default locale without warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { resolve } = createResolver(strategy)

      const resolved = resolve({ path: '/about' }, 'ja')
      expect(resolved).toBeTruthy()
      expect(warn.mock.calls.filter(c => String(c[0]).includes('No match'))).toEqual([])
      warn.mockRestore()
    })

    test('resolves a nested path without warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { resolve } = createResolver(strategy)

      expect(resolve({ path: '/user/1/profile' }, 'ja')).toBeTruthy()
      expect(warn.mock.calls.filter(c => String(c[0]).includes('No match'))).toEqual([])
      warn.mockRestore()
    })

    test('resolves the root path', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { resolve } = createResolver(strategy)

      expect(resolve({ path: '/' }, 'ja')).toBeTruthy()
      expect(warn.mock.calls.filter(c => String(c[0]).includes('No match'))).toEqual([])
      warn.mockRestore()
    })

    test('an unknown path does not throw', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { resolve } = createResolver(strategy)

      expect(() => resolve({ path: '/nope' }, 'ja')).not.toThrow()
      warn.mockRestore()
    })
  }
)

describe('createLocalizedRouteByPathResolver (no routing)', () => {
  test('returns the route untouched', () => {
    const { resolve } = createResolver('no_prefix')
    const route = { path: '/about' }
    expect(resolve(route, 'ja')).toBe(route)
  })
})

import { describe, expect, test } from 'vitest'
import { createNavigationResolver } from '../src/runtime/routing/navigation'
import { getLocaleFromRoutePath } from '../src/runtime/kit/routing'

import type { NavigationResolverConfig } from '../src/runtime/routing/navigation'
import type { CompatRoute } from '../src/runtime/types'

const LOCALES = ['en', 'fr']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const route = (overrides: Partial<CompatRoute> = {}): CompatRoute =>
  ({ path: '/about', fullPath: '/about', name: 'about___en', matched: [], meta: {}, ...overrides }) as any

const ROUTES = new Set(['index___en', 'index___fr', 'about___en', 'about___fr', 'test-route___en', 'test-route___fr'])

// mirrors `localePath`/`switchLocalePath` for existing routes with `strategy: prefix_except_default`
const localizePath = (path: string, locale: string) =>
  locale === 'en' ? path : '/' + locale + (path === '/' ? '' : path)
const unprefixedPath = (path: string) => '/' + path.split('/').filter(s => s && !LOCALES.includes(s)).join('/')

function createResolver(overrides: Partial<NavigationResolverConfig> = {}) {
  return createNavigationResolver({
    localePath: localizePath,
    switchLocalePath: (locale, to) => localizePath(unprefixedPath(String(to.fullPath)), locale),
    routeLocale: to => getLocaleFromRoutePath(String(to.path)),
    hasRoute: name => ROUTES.has(name),
    getLocaleCodes: () => LOCALES,
    strategy: 'prefix_except_default',
    compactRoutes: false,
    ...overrides,
  })
}

describe('createNavigationResolver', () => {
  test('navigates to the localized route for the target locale', () => {
    const resolve = createResolver()
    expect(resolve(route(), 'fr')).toEqual({ path: '/fr/about', code: undefined })
  })

  test('uses `redirectStatusCode` for the redirect', () => {
    const resolve = createResolver({ redirectStatusCode: 307 })
    expect(resolve(route(), 'fr')).toEqual({ path: '/fr/about', code: 307 })
  })

  test('`rootRedirect` navigates to its localized path and status code', () => {
    const resolve = createResolver({ rootRedirect: { path: '/test-route', code: 418 } })
    expect(resolve(route({ path: '/', fullPath: '/', name: 'index___en' }), 'fr')).toEqual({
      path: '/fr/test-route',
      code: 418,
    })
  })

  test('(#3987) skips routes with localization disabled', () => {
    const resolve = createResolver()
    // unsuffixed route name without localized variants
    expect(resolve(route({ name: 'disabled' }), 'fr')).toBeUndefined()
  })

  test('compact route matches are not treated as disabled', () => {
    const resolve = createResolver({ compactRoutes: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const to = route({ name: 'compact', matched: [{ meta: { __i18nCompact: true } }] as any })
    expect(resolve(to, 'fr')).toEqual({ path: '/fr/about', code: undefined })
  })

  test('skips while a locale change is pending in middleware', () => {
    const resolve = createResolver()
    expect(resolve(route(), 'fr', true)).toBeUndefined()
  })

  test('(#2288) skips when the route already matches the target locale', () => {
    const resolve = createResolver()
    expect(resolve(route({ path: '/fr/about', fullPath: '/fr/about', name: 'about___fr' }), 'fr')).toBeUndefined()
  })

  test('(#1889, #2226) skips when the destination equals the current route', () => {
    const resolve = createResolver()
    expect(resolve(route(), 'en')).toBeUndefined()
  })

  test('navigates to locales served on the current host under domain setups', () => {
    const resolve = createResolver({ isLocaleOnHost: locale => locale !== 'fr' })
    expect(resolve(route(), 'fr')).toBeUndefined()
    expect(resolve(route({ path: '/fr/about', fullPath: '/fr/about', name: 'about___fr' }), 'en')).toEqual({
      path: '/about',
      code: undefined,
    })
  })
})

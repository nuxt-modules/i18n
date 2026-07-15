import { describe, expect, test } from 'vitest'
import { createRedirectResolver } from '../src/runtime/server/utils/redirect'
import { resolveRootRedirect } from '../src/runtime/shared/utils'
import { getLocaleFromRoutePath } from '../src/runtime/kit/routing'

import type { RedirectResolverConfig } from '../src/runtime/server/utils/redirect'
import type { Strategies } from '../src/types'

const LOCALES = ['en', 'fr']

function createDetectors(overrides: Partial<ReturnType<typeof detectors>> = {}) {
  return { ...detectors(), ...overrides }
}
const detectors = () => ({
  cookie: (): string | undefined => undefined,
  header: (): string | undefined => undefined,
  navigator: (): string | undefined => undefined,
  host: (): string | undefined => undefined,
  route: (path: string | object) => getLocaleFromRoutePath(String(path)),
})

// mirrors the `matchLocalized` contract for paths that match a route
const createMatchLocalized = (strategy: Strategies) => (path: string, locale: string, defaultLocale: string) => {
  const prefixed = strategy === 'prefix' || locale !== defaultLocale
  return prefixed ? '/' + locale + (path === '/' ? '' : path) : path
}

const detection = (overrides: Partial<RedirectResolverConfig['detection']> = {}) =>
  ({ enabled: false, cookieKey: 'i18n_redirected', ...overrides }) as RedirectResolverConfig['detection']

function createResolver(overrides: Partial<RedirectResolverConfig> = {}) {
  const strategy = overrides.strategy ?? 'prefix'
  return createRedirectResolver({
    detection: detection(),
    matchLocalized: createMatchLocalized(strategy),
    isSupportedLocale: locale => LOCALES.includes(locale || ''),
    strategy,
    routing: true,
    domains: false,
    ...overrides,
  })
}

describe('createRedirectResolver', () => {
  test('redirects the root path to the default locale with `strategy: prefix`', () => {
    const resolve = createResolver()
    expect(resolve('/', '/', undefined, 'en', createDetectors())).toMatchObject({ path: '/en', code: 302 })
  })

  test('does not redirect the root path with other strategies', () => {
    const resolve = createResolver({ strategy: 'prefix_except_default' })
    expect(resolve('/', '/', undefined, 'en', createDetectors()).path).toBeUndefined()
  })

  test('`rootRedirect` to a locale-prefixed path is used as-is', () => {
    const resolve = createResolver({ rootRedirect: resolveRootRedirect('fr') })
    expect(resolve('/', '/', undefined, 'en', createDetectors())).toMatchObject({ path: '/fr', code: 302 })
  })

  test('(#2758) `rootRedirect` object sets the localized path and status code', () => {
    const resolve = createResolver({ rootRedirect: resolveRootRedirect({ statusCode: 418, path: 'test-route' }) })
    expect(resolve('/', '/', undefined, 'en', createDetectors())).toMatchObject({ path: '/en/test-route', code: 418 })
  })

  test('`rootRedirect` only applies to the root path', () => {
    const resolve = createResolver({
      detection: detection({ enabled: true, redirectOn: 'no prefix' }),
      rootRedirect: resolveRootRedirect({ statusCode: 418, path: 'test-route' }),
    })
    expect(resolve('/about', '/about', undefined, 'en', createDetectors())).toMatchObject({
      path: '/en/about',
      code: 302,
    })
  })

  test('unprefixed paths are not redirected without detection', () => {
    const resolve = createResolver()
    expect(resolve('/about', '/about', undefined, 'en', createDetectors()).path).toBeUndefined()
  })

  test('`redirectStatusCode` applies to detection redirects', () => {
    const resolve = createResolver({
      detection: detection({ enabled: true, redirectOn: 'no prefix' }),
      redirectStatusCode: 307,
    })
    expect(resolve('/about', '/about', undefined, 'en', createDetectors())).toMatchObject({
      path: '/en/about',
      code: 307,
    })
  })

  test('`redirectStatusCode` does not affect the `rootRedirect` status code', () => {
    const resolve = createResolver({
      detection: detection({ enabled: true, redirectOn: 'no prefix' }),
      rootRedirect: resolveRootRedirect({ statusCode: 418, path: 'test-route' }),
      redirectStatusCode: 307,
    })
    expect(resolve('/', '/', undefined, 'en', createDetectors())).toMatchObject({ path: '/en/test-route', code: 418 })
  })

  test("`redirectOn: 'root'` only redirects the root path", () => {
    const resolve = createResolver({
      strategy: 'prefix_except_default',
      detection: detection({ enabled: true, redirectOn: 'root' }),
    })
    const withCookie = createDetectors({ cookie: () => 'fr' })
    expect(resolve('/', '/', undefined, 'en', withCookie)).toMatchObject({ path: '/fr', locale: 'fr' })
    expect(resolve('/about', '/about', undefined, 'en', withCookie).path).toBeUndefined()
  })

  test("`redirectOn: 'no prefix'` skips prefixed paths", () => {
    const resolve = createResolver({
      strategy: 'prefix_except_default',
      detection: detection({ enabled: true, redirectOn: 'no prefix' }),
    })
    const withCookie = createDetectors({ cookie: () => 'fr' })
    expect(resolve('/about', '/about', undefined, 'en', withCookie)).toMatchObject({ path: '/fr/about' })
    expect(resolve('/fr/about', '/about', 'fr', 'en', withCookie).path).toBeUndefined()
  })

  test("`redirectOn: 'all'` does not redirect to `fallbackLocale` from a prefixed path", () => {
    const resolve = createResolver({
      strategy: 'prefix_except_default',
      detection: detection({ enabled: true, redirectOn: 'all', fallbackLocale: 'fr' }),
    })
    // the route locale wins, the default-locale prefix is normalized away
    expect(resolve('/en/about', '/about', 'en', 'en', createDetectors())).toMatchObject({
      path: '/about',
      locale: 'en',
    })
  })

  test("`redirectOn: 'all'` redirects prefixed paths too", () => {
    const resolve = createResolver({
      strategy: 'prefix_except_default',
      detection: detection({ enabled: true, redirectOn: 'all' }),
    })
    const withCookie = createDetectors({ cookie: () => 'fr' })
    expect(resolve('/en/about', '/about', 'en', 'en', withCookie)).toMatchObject({ path: '/fr/about' })
  })

  test('detection prefers the cookie locale over the header locale', () => {
    const resolve = createResolver({ detection: detection({ enabled: true, redirectOn: 'root' }) })
    const result = resolve('/', '/', undefined, 'en', createDetectors({ cookie: () => 'fr', header: () => 'en' }))
    expect(result.locale).toBe('fr')
  })

  test('unsupported detected locales are skipped', () => {
    const resolve = createResolver({ detection: detection({ enabled: true, redirectOn: 'root' }) })
    const result = resolve('/', '/', undefined, 'en', createDetectors({ cookie: () => 'xx', header: () => 'fr' }))
    expect(result.locale).toBe('fr')
  })

  test('falls back to `detection.fallbackLocale`', () => {
    const resolve = createResolver({
      strategy: 'prefix_except_default',
      detection: detection({ enabled: true, redirectOn: 'root', fallbackLocale: 'fr' }),
    })
    expect(resolve('/', '/', undefined, 'en', createDetectors())).toMatchObject({ path: '/fr', locale: 'fr' })
  })

  test('resolves the locale from the route prefix', () => {
    const resolve = createResolver({ strategy: 'prefix_except_default' })
    expect(resolve('/fr/about', '/about', 'fr', 'en', createDetectors()).locale).toBe('fr')
  })
})

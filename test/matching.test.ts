import { describe, expect, test } from 'vitest'
import { createPathMatcher } from '../src/runtime/shared/matching'
import type { RouteResources } from '../src/routing'

/** `/about` is localized per locale, `/contact` is disabled for `ja`, `/legal` is disabled entirely */
const resources: RouteResources = {
  localizedPaths: ['/', '/contact', '/posts/:id'],
  pathToI18nConfig: {
    '/about': { en: '/about', fr: '/a-propos' },
    '/contact': { ja: false }
  },
  i18nPathToPath: { '/about': '/about', '/a-propos': '/about' },
  disabledPaths: ['/legal']
}

const matcher = (config: Partial<Parameters<typeof createPathMatcher>[1]> = {}) =>
  createPathMatcher(resources, { strategy: 'prefix_except_default', routing: true, trailingSlash: false, ...config })

describe('isExistingNuxtRoute', () => {
  test('matches generated routes and ignores the rest', () => {
    const { isExistingNuxtRoute } = matcher()
    expect(isExistingNuxtRoute('/about')).toBeTruthy()
    expect(isExistingNuxtRoute('/posts/1')).toBeTruthy()
    expect(isExistingNuxtRoute('/nope')).toBeUndefined()
    expect(isExistingNuxtRoute('')).toBeUndefined()
    expect(isExistingNuxtRoute('/some/__nuxt_error')).toBeUndefined()
  })

  test('a path with localization disabled is not treated as a route', () => {
    expect(matcher().isExistingNuxtRoute('/legal')).toBeUndefined()
  })
})

describe('matchLocalized', () => {
  test('resolves the localized path for the target locale', () => {
    const { matchLocalized } = matcher()
    expect(matchLocalized('/about', 'fr', 'en')).toBe('/fr/a-propos')
    expect(matchLocalized('/a-propos', 'en', 'en')).toBe('/about')
  })

  test('keeps the default locale unprefixed under `prefix_except_default`', () => {
    expect(matcher().matchLocalized('/contact', 'en', 'en')).toBe('/contact')
  })

  test('`prefix` prefixes the default locale too', () => {
    expect(matcher({ strategy: 'prefix' }).matchLocalized('/contact', 'en', 'en')).toBe('/en/contact')
  })

  test('a locale the path is disabled for resolves to nothing, not the home page', () => {
    // matching `/` instead would redirect the request to that locale's home page
    expect(matcher().matchLocalized('/contact', 'ja', 'en')).toBeUndefined()
  })

  test('`trailingSlash` is applied to the resolved path', () => {
    const { matchLocalized } = matcher({ trailingSlash: true })
    expect(matchLocalized('/about', 'fr', 'en')).toBe('/fr/a-propos/')
    expect(matchLocalized('/contact', 'en', 'en')).toBe('/contact/')
  })

  test('dynamic params are carried into the localized path', () => {
    expect(matcher().matchLocalized('/posts/42', 'fr', 'en')).toBe('/fr/posts/42')
  })

  test('an unmatched or empty path resolves to nothing', () => {
    const { matchLocalized } = matcher()
    expect(matchLocalized('', 'fr', 'en')).toBeUndefined()
    expect(matchLocalized('/nope', 'fr', 'en')).toBeUndefined()
  })
})

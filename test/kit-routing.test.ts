import { describe, expect, test } from 'vitest'
import {
  getLocaleFromRoute,
  getLocaleFromRouteName,
  getLocaleFromRoutePath,
  getLocalizedRouteName,
  getRouteBaseName,
  prefixable,
} from '../src/runtime/kit/routing'

describe('localized route name encode/decode', () => {
  test.each([
    ['index', 'en'],
    ['blog-slug', 'nl'],
    ['nested-deep-page', 'pt-BR'],
  ])('round-trips %s + %s', (name, locale) => {
    const localized = getLocalizedRouteName(name, locale, false)
    expect(getRouteBaseName(localized)).toBe(name)
    expect(getLocaleFromRouteName(localized)).toBe(locale)
  })

  test('round-trips default-locale variant', () => {
    const localized = getLocalizedRouteName('about', 'en', true)
    expect(localized).toBe('about___en___default')
    expect(getRouteBaseName(localized)).toBe('about')
    expect(getLocaleFromRouteName(localized)).toBe('en')
  })

  test('unlocalized name is its own base name', () => {
    expect(getRouteBaseName('about')).toBe('about')
    expect(getLocaleFromRouteName('about')).toBe('')
  })
})

describe('getLocaleFromRoute', () => {
  const LOCALES = ['en', 'nl', 'fr']

  test('parses locale from path input', () => {
    expect(getLocaleFromRoute('/en/about', LOCALES)).toBe('en')
    expect(getLocaleFromRoute({ path: '/nl/about' }, LOCALES)).toBe('nl')
  })

  test('prefers route name over path', () => {
    expect(getLocaleFromRoute({ name: 'about___fr', path: '/en/about' }, LOCALES)).toBe('fr')
  })

  test('falls back to path for names without locale suffix (compact routes)', () => {
    expect(getLocaleFromRoute({ name: 'about', path: '/en/about' }, LOCALES)).toBe('en')
  })

  // a locale code can span more than one path segment
  test('recognizes a locale code that spans more than one path segment', () => {
    expect(getLocaleFromRoute('/en/formal/about', ['en', 'en/formal'])).toBe('en/formal')
    expect(getLocaleFromRoute({ path: '/en/formal' }, ['en', 'en/formal'])).toBe('en/formal')
  })
})

describe('getLocaleFromRoutePath', () => {
  test('matches a single-segment locale', () => {
    expect(getLocaleFromRoutePath('/en/about', ['en', 'fr'])).toBe('en')
  })

  // a locale code may span more than one path segment
  test('matches a multi-segment locale, even alongside an overlapping shorter one', () => {
    expect(getLocaleFromRoutePath('/en/formal/about', ['en', 'en/formal'])).toBe('en/formal')
    expect(getLocaleFromRoutePath('/en/about', ['en', 'en/formal'])).toBe('en')
  })

  test('does not match a segment that merely starts with a configured code', () => {
    expect(getLocaleFromRoutePath('/english/about', ['en'])).toBe('')
  })

  test('matches the locale alone, with nothing trailing', () => {
    expect(getLocaleFromRoutePath('/en/formal', ['en/formal'])).toBe('en/formal')
  })

  test('returns nothing for the root path or an unconfigured locale', () => {
    expect(getLocaleFromRoutePath('/', ['en'])).toBe('')
    expect(getLocaleFromRoutePath('/de/about', ['en'])).toBe('')
  })

  // a fragment glued onto the last segment must not shadow a longer configured locale
  test('strips a query string or hash fragment before matching', () => {
    expect(getLocaleFromRoutePath('/en/formal?x=1', ['en', 'en/formal'])).toBe('en/formal')
    expect(getLocaleFromRoutePath('/en/formal#pricing', ['en', 'en/formal'])).toBe('en/formal')
  })
})

describe('prefixable', () => {
  const options = { strategy: 'prefix_except_default', routing: true } as const

  test('prefixes non-default locales when routing is enabled', () => {
    expect(prefixable('fr', 'en', options)).toBe(true)
    expect(prefixable('en', 'en', options)).toBe(false)
  })

  test('prefixes the default locale with strategy prefix', () => {
    expect(prefixable('en', 'en', { ...options, strategy: 'prefix' })).toBe(true)
  })

  test('never prefixes without routing', () => {
    expect(prefixable('fr', 'en', { ...options, strategy: 'prefix', routing: false })).toBe(false)
  })

  // domain setups need no exemption, `defaultLocale` is the domain's default
  test('does not prefix the domain default locale', () => {
    expect(prefixable('fr', 'fr', options)).toBe(false)
    expect(prefixable('en', 'fr', options)).toBe(true)
  })
})

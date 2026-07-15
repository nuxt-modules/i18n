import { describe, expect, test } from 'vitest'
import {
  getLocaleFromRoute,
  getLocaleFromRouteName,
  getLocalizedRouteName,
  getRouteBaseName,
  prefixable,
} from '../src/runtime/kit/routing'
import type { PrefixableOptions } from '../src/runtime/kit/routing'

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
  test('parses locale from path input', () => {
    expect(getLocaleFromRoute('/en/about')).toBe('en')
    expect(getLocaleFromRoute({ path: '/nl/about' })).toBe('nl')
  })

  test('prefers route name over path', () => {
    expect(getLocaleFromRoute({ name: 'about___fr', path: '/en/about' })).toBe('fr')
  })

  test('falls back to path for names without locale suffix (compact routes)', () => {
    expect(getLocaleFromRoute({ name: 'about', path: '/en/about' })).toBe('en')
  })
})

describe('prefixable', () => {
  const options: PrefixableOptions = { strategy: 'prefix_except_default', routing: true, differentDomains: false }

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

  test('never prefixes with different domains', () => {
    expect(prefixable('fr', 'en', { ...options, strategy: 'prefix', differentDomains: true })).toBe(false)
  })
})

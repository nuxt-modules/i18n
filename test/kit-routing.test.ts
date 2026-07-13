import { describe, expect, test, vi } from 'vitest'
import {
  getLocaleFromRoute,
  getLocaleFromRouteName,
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
  test('prefixes non-default locales when routing is enabled', () => {
    vi.stubGlobal('__I18N_ROUTING__', true)
    vi.stubGlobal('__I18N_STRATEGY__', 'prefix_except_default')
    expect(prefixable('fr', 'en')).toBe(true)
    expect(prefixable('en', 'en')).toBe(false)
  })

  test('prefixes the default locale with strategy prefix', () => {
    vi.stubGlobal('__I18N_ROUTING__', true)
    vi.stubGlobal('__I18N_STRATEGY__', 'prefix')
    expect(prefixable('en', 'en')).toBe(true)
  })

  test('never prefixes without routing', () => {
    vi.stubGlobal('__I18N_ROUTING__', false)
    vi.stubGlobal('__I18N_STRATEGY__', 'prefix')
    expect(prefixable('fr', 'en')).toBe(false)
  })

  test('never prefixes with different domains', () => {
    vi.stubGlobal('__I18N_ROUTING__', true)
    vi.stubGlobal('__I18N_STRATEGY__', 'prefix')
    vi.stubGlobal('__DIFFERENT_DOMAINS__', true)
    expect(prefixable('fr', 'en')).toBe(false)
    vi.stubGlobal('__DIFFERENT_DOMAINS__', false)
  })
})

import { describe, it, assert, test } from 'vitest'
import { createLocaleRouteNameGetter } from '../src/runtime/routing/utils'
import { findBrowserLocale } from '#i18n-kit/browser'

const ROUTE_GEN_CONFIG = {
  defaultLocale: 'en',
  routesNameSeparator: '___',
  defaultLocaleRouteNameSuffix: 'default'
}

const routeNameGetters = {
  // noPrefix: createLocaleRouteNameGetter({ strategy: 'no_prefix', differentDomains: false, ...ROUTE_GEN_CONFIG }),
  noPrefix: (...args) => {
    globalThis['__I18N_STRATEGY__'] = 'no_prefix'
    globalThis['__I18N_ROUTING__'] = false
    return createLocaleRouteNameGetter(ROUTE_GEN_CONFIG.defaultLocale)(...args)
  },
  prefixAndDefault: (...args) => {
    globalThis['__I18N_STRATEGY__'] = 'prefix_and_default'
    globalThis['__I18N_ROUTING__'] = true
    return createLocaleRouteNameGetter(ROUTE_GEN_CONFIG.defaultLocale)(...args)
  },
  prefixExceptDefault: (...args) => {
    globalThis['__I18N_STRATEGY__'] = 'prefix_except_default'
    globalThis['__I18N_ROUTING__'] = true
    return createLocaleRouteNameGetter(ROUTE_GEN_CONFIG.defaultLocale)(...args)
  }
}

describe('getLocaleRouteName', () => {
  describe('strategy: prefix_and_default', () => {
    it('should be `route1___en___default`', () => {
      assert.equal(routeNameGetters.prefixAndDefault('route1', 'en'), 'route1___en___default')
    })
  })

  describe('strategy: prefix_except_default', () => {
    it('should be `route1___en`', () => {
      assert.equal(routeNameGetters.prefixExceptDefault('route1', 'en'), 'route1___en')
    })
  })

  describe('strategy: no_prefix', () => {
    it('should be `route1`', () => {
      assert.equal(routeNameGetters.noPrefix('route1', 'en'), 'route1')
    })
  })

  describe('irregular', () => {
    describe('route name is null', () => {
      it('should be ` (null)___en___default`', () => {
        assert.equal(routeNameGetters.prefixAndDefault(null, 'en'), '___en___default')
      })
    })
  })
})

const normalize = (locales: { code: string }[]) => locales.map(x => ({ code: x.code, language: x.code }))
describe('findBrowserLocale', () => {
  test('matches highest-ranked full locale', () => {
    const locales = [{ code: 'en' }, { code: 'en-US' }]
    const browserLocales = ['en-US', 'en']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en-US')
  })

  test('matches highest-ranked short locale', () => {
    const locales = [{ code: 'en' }, { code: 'en-US' }]
    const browserLocales = ['en', 'en-US']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en')
  })

  test('matches highest-ranked short locale (only short defined)', () => {
    const locales = [{ code: 'en' }]
    const browserLocales = ['en-US', 'en']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en')
  })

  test('matches highest-ranked short locale', () => {
    const locales = [{ code: 'en' }, { code: 'fr' }]
    const browserLocales = ['en-US', 'en-GB']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en')
  })

  test('does not match any locale', () => {
    const locales = [{ code: 'pl' }, { code: 'fr' }]
    const browserLocales = ['en-US', 'en']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === '')
  })

  test('matches full locale with mixed short and full, full having highest rank', () => {
    const locales = [{ code: 'en-US' }, { code: 'en-GB' }, { code: 'en' }]
    const browserLocales = ['en-GB', 'en-US', 'en']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en-GB')
  })

  test('matches short locale with mixed short and full, short having highest rank', () => {
    const locales = [{ code: 'en-US' }, { code: 'en-GB' }, { code: 'en' }]
    const browserLocales = ['en', 'en-GB', 'en-US']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en')
  })

  test('matches short locale case-insensitively', () => {
    const locales = [{ code: 'EN' }, { code: 'en-GB' }]
    const browserLocales = ['en', 'en-GB', 'en-US']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'EN')
  })

  test('matches long locale case-insensitively', () => {
    const locales = [{ code: 'en-gb' }, { code: 'en-US' }]
    const browserLocales = ['en-GB', 'en-US']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en-gb')
  })

  test('matches `language` locale code', () => {
    const locales = [
      { code: 'cn', language: 'zh-CN' },
      { code: 'en', language: 'en-US' }
    ]
    const browserLocales = ['zh', 'zh-CN']

    assert.ok(findBrowserLocale(locales, browserLocales) === 'cn')
  })

  test('matches full `language` code', () => {
    const locales = [
      { code: 'us', language: 'en-US' },
      { code: 'gb', language: 'en-GB' }
    ]
    const browserLocales = ['en-GB', 'en']

    assert.ok(findBrowserLocale(locales, browserLocales) === 'gb')
  })

  test('matches locale when only languages match', () => {
    const locales = [{ code: 'en-GB' }, { code: 'en-US' }]
    const browserLocales = ['en-IN', 'en']

    assert.ok(findBrowserLocale(normalize(locales), browserLocales) === 'en-GB')
  })
})

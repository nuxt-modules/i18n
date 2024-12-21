import { describe, it, assert, test } from 'vitest'
import * as utils from '../src/runtime/routing/utils'

describe('getLocaleRouteName', () => {
  describe('strategy: prefix_and_default', () => {
    it('should be `route1___en___default`', () => {
      assert.equal(
        utils.getLocaleRouteName('route1', 'en', {
          defaultLocale: 'en',
          strategy: 'prefix_and_default',
          routesNameSeparator: '___',
          defaultLocaleRouteNameSuffix: 'default',
          differentDomains: false
        }),
        'route1___en___default'
      )
    })
  })

  describe('strategy: prefix_except_default', () => {
    it('should be `route1___en`', () => {
      assert.equal(
        utils.getLocaleRouteName('route1', 'en', {
          defaultLocale: 'en',
          strategy: 'prefix_except_default',
          routesNameSeparator: '___',
          defaultLocaleRouteNameSuffix: 'default',
          differentDomains: false
        }),
        'route1___en'
      )
    })
  })

  describe('strategy: no_prefix', () => {
    it('should be `route1`', () => {
      assert.equal(
        utils.getLocaleRouteName('route1', 'en', {
          defaultLocale: 'en',
          strategy: 'no_prefix',
          routesNameSeparator: '___',
          defaultLocaleRouteNameSuffix: 'default',
          differentDomains: false
        }),
        'route1'
      )
    })
  })

  describe('irregular', () => {
    describe('route name is null', () => {
      it('should be ` (null)___en___default`', () => {
        assert.equal(
          utils.getLocaleRouteName(null, 'en', {
            defaultLocale: 'en',
            strategy: 'prefix_and_default',
            routesNameSeparator: '___',
            defaultLocaleRouteNameSuffix: 'default',
            differentDomains: false
          }),
          '(null)___en___default'
        )
      })
    })
  })
})

describe('findBrowserLocale', () => {
  test('matches highest-ranked full locale', () => {
    const locales = [{ code: 'en' }, { code: 'en-US' }]
    const browserLocales = ['en-US', 'en']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en-US')
  })

  test('matches highest-ranked short locale', () => {
    const locales = [{ code: 'en' }, { code: 'en-US' }]
    const browserLocales = ['en', 'en-US']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en')
  })

  test('matches highest-ranked short locale (only short defined)', () => {
    const locales = [{ code: 'en' }]
    const browserLocales = ['en-US', 'en']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en')
  })

  test('matches highest-ranked short locale', () => {
    const locales = [{ code: 'en' }, { code: 'fr' }]
    const browserLocales = ['en-US', 'en-GB']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en')
  })

  test('does not match any locale', () => {
    const locales = [{ code: 'pl' }, { code: 'fr' }]
    const browserLocales = ['en-US', 'en']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === '')
  })

  test('matches full locale with mixed short and full, full having highest rank', () => {
    const locales = [{ code: 'en-US' }, { code: 'en-GB' }, { code: 'en' }]
    const browserLocales = ['en-GB', 'en-US', 'en']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en-GB')
  })

  test('matches short locale with mixed short and full, short having highest rank', () => {
    const locales = [{ code: 'en-US' }, { code: 'en-GB' }, { code: 'en' }]
    const browserLocales = ['en', 'en-GB', 'en-US']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en')
  })

  test('matches short locale case-insensitively', () => {
    const locales = [{ code: 'EN' }, { code: 'en-GB' }]
    const browserLocales = ['en', 'en-GB', 'en-US']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'EN')
  })

  test('matches long locale case-insensitively', () => {
    const locales = [{ code: 'en-gb' }, { code: 'en-US' }]
    const browserLocales = ['en-GB', 'en-US']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en-gb')
  })

  test('matches `language` locale code', () => {
    const locales = [
      { code: 'cn', language: 'zh-CN' },
      { code: 'en', language: 'en-US' }
    ]
    const browserLocales = ['zh', 'zh-CN']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'cn')
  })

  test('matches full `language` code', () => {
    const locales = [
      { code: 'us', language: 'en-US' },
      { code: 'gb', language: 'en-GB' }
    ]
    const browserLocales = ['en-GB', 'en']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'gb')
  })

  test('matches locale when only languages match', () => {
    const locales = [{ code: 'en-GB' }, { code: 'en-US' }]
    const browserLocales = ['en-IN', 'en']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'en-GB')
  })
})

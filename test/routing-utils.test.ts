import { describe, it, assert, test } from 'vitest'
import * as utils from '../src/runtime/routing/utils'

describe('adjustRouteDefinitionForTrailingSlash', function () {
  describe('pagePath: /foo/bar', function () {
    describe('trailingSlash: false, isChildWithRelativePath: true', function () {
      it('should be trailed with slash: /foo/bar/', function () {
        assert.equal(utils.adjustRoutePathForTrailingSlash('/foo/bar', true, true), '/foo/bar/')
      })
    })

    describe('trailingSlash: false, isChildWithRelativePath: true', function () {
      it('should not be trailed with slash: /foo/bar/', function () {
        assert.equal(utils.adjustRoutePathForTrailingSlash('/foo/bar', false, true), '/foo/bar')
      })
    })

    describe('trailingSlash: false, isChildWithRelativePath: false', function () {
      it('should be trailed with slash: /foo/bar/', function () {
        assert.equal(utils.adjustRoutePathForTrailingSlash('/foo/bar', true, false), '/foo/bar/')
      })
    })

    describe('trailingSlash: false, isChildWithRelativePath: false', function () {
      it('should not be trailed with slash: /foo/bar/', function () {
        assert.equal(utils.adjustRoutePathForTrailingSlash('/foo/bar', false, false), '/foo/bar')
      })
    })
  })

  describe('pagePath: /', function () {
    describe('trailingSlash: false, isChildWithRelativePath: true', function () {
      it('should not be trailed with slash: empty', function () {
        assert.equal(utils.adjustRoutePathForTrailingSlash('/', false, true), '')
      })
    })
  })

  describe('pagePath: empty', function () {
    describe('trailingSlash: true, isChildWithRelativePath: true', function () {
      it('should not be trailed with slash: /', function () {
        assert.equal(utils.adjustRoutePathForTrailingSlash('', true, true), '/')
      })
    })
  })
})

describe('getLocaleRouteName', () => {
  describe('strategy: prefix_and_default', () => {
    it('should be `route1___en___default`', () => {
      assert.equal(
        utils.getLocaleRouteName('route1', 'en', {
          defaultLocale: 'en',
          strategy: 'prefix_and_default',
          routesNameSeparator: '___',
          defaultLocaleRouteNameSuffix: 'default'
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
          defaultLocaleRouteNameSuffix: 'default'
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
          defaultLocaleRouteNameSuffix: 'default'
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
            defaultLocaleRouteNameSuffix: 'default'
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

  test('matches ISO locale code', () => {
    const locales = [
      { code: 'cn', language: 'zh-CN' },
      { code: 'en', language: 'en-US' }
    ]
    const browserLocales = ['zh', 'zh-CN']

    assert.ok(utils.findBrowserLocale(locales, browserLocales) === 'cn')
  })

  test('matches full ISO code', () => {
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

  it('options', () => {
    const locale = utils.findBrowserLocale([{ code: 'en' }, { code: 'ja' }], ['ja-JP', 'en-US'], {
      // custom matcher
      matcher(locales, browserLocales) {
        const matchedLocales = [] as utils.BrowserLocale[]
        for (const [index, browserCode] of browserLocales.entries()) {
          const languageCode = browserCode.split('-')[0].toLowerCase()
          const matchedLocale = locales.find(l => l.language.split('-')[0].toLowerCase() === languageCode)
          if (matchedLocale) {
            matchedLocales.push({ code: matchedLocale.code, score: 1 * index })
            break
          }
        }
        return matchedLocales
      },
      // custom comparer
      comparer: (a, b) => a.score - b.score
    })
    assert.ok(locale === 'ja')
  })
})

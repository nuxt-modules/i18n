import path from 'path'
import { matchBrowserLocale, parseAcceptLanguage } from '../src/templates/utils-common'

describe('parsePages', () => {
  test('parses in-component options', async () => {
    const { extractComponentOptions } = await import('../src/helpers/components')
    const options = extractComponentOptions(path.join(__dirname, './fixture/typescript/pages/index.vue'))
    expect(options).toHaveProperty('paths')
    expect(options.paths).toHaveProperty('pl')
    expect(options.paths.pl).toBe('/polish')
  })

  test('triggers warning with invalid in-component options', async () => {
    const { extractComponentOptions } = await import('../src/helpers/components')

    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const options = extractComponentOptions(path.join(__dirname, './fixture/typescript/pages/invalidOptions.vue'))
    expect(spy.mock.calls[0][0]).toContain('Error parsing')
    spy.mockRestore()

    expect(Object.keys(options).length).toBe(0)
  })
})

describe('parseAcceptLanguage', () => {
  test('parses browser accept-language', () => {
    expect(parseAcceptLanguage('en-US,en;q=0.9,nb;q=0.8,no;q=0.7')).toStrictEqual(['en-US', 'en', 'nb', 'no'])
  })
})

describe('matchBrowserLocale', () => {
  test('matches highest-ranked full locale', () => {
    // Both locales match first browser locale - full locale should win.
    const appLocales = ['en', 'en-US']
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-US')
  })

  test('matches highest-ranked short locale', () => {
    // Both locales match first browser locale - short locale should win.
    // This is because browser locale order defines scoring so we prefer higher-scored over exact.
    const appLocales = ['en', 'en-US']
    const browserLocales = ['en', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('matches highest-ranked short locale (only short defined)', () => {
    const appLocales = ['en']
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('matches highest-ranked short locale', () => {
    const appLocales = ['en', 'fr']
    const browserLocales = ['en-US', 'en-GB']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('does not match any locale', () => {
    const appLocales = ['pl', 'fr']
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe(null)
  })

  test('matches full locale with mixed short and full, full having highest rank', () => {
    const appLocales = ['en-US', 'en-GB', 'en']
    const browserLocales = ['en-GB', 'en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-GB')
  })

  test('matches short locale with mixed short and full, short having highest rank', () => {
    const appLocales = ['en-US', 'en-GB', 'en']
    const browserLocales = ['en', 'en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('matches short locale case-insensitively', () => {
    const appLocales = ['EN', 'en-GB']
    const browserLocales = ['en', 'en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('EN')
  })

  test('matches long locale case-insensitively', () => {
    const appLocales = ['en-gb', 'en-US']
    const browserLocales = ['en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-gb')
  })

  test('matches locale when only languages match', () => {
    const appLocales = ['en-GB', 'en-US']
    const browserLocales = ['en-IN', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-GB')
  })
})

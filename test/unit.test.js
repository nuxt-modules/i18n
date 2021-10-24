import path from 'path'
import { parseComponent } from 'vue-template-compiler'
import { matchBrowserLocale, parseAcceptLanguage } from '../src/templates/utils-common'

describe('parsePages', () => {
  test('parses in-component options', async () => {
    const { extractComponentOptions } = await import('../src/helpers/components')
    const options = extractComponentOptions(path.join(__dirname, './fixture/typescript/pages/index.vue'), parseComponent)
    expect(options).toHaveProperty('paths')
    if (options) {
      expect(options.paths).toHaveProperty('pl')
      expect(options.paths.pl).toBe('/polish')
    }
  })

  test('triggers warning with invalid in-component options', async () => {
    const { extractComponentOptions } = await import('../src/helpers/components')

    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { })
    const options = extractComponentOptions(path.join(__dirname, './fixture/typescript/pages/invalidOptions.vue'), parseComponent)
    expect(spy.mock.calls[0][0]).toContain('Error parsing')
    spy.mockRestore()

    expect(options).toHaveProperty('paths')
    expect(options).toHaveProperty('locales')
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
    const appLocales = [{ code: 'en' }, { code: 'en-US' }]
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-US')
  })

  test('matches highest-ranked short locale', () => {
    // Both locales match first browser locale - short locale should win.
    // This is because browser locale order defines scoring so we prefer higher-scored over exact.
    const appLocales = [{ code: 'en' }, { code: 'en-US' }]
    const browserLocales = ['en', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('matches highest-ranked short locale (only short defined)', () => {
    const appLocales = [{ code: 'en' }]
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('matches highest-ranked short locale', () => {
    const appLocales = [{ code: 'en' }, { code: 'fr' }]
    const browserLocales = ['en-US', 'en-GB']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('does not match any locale', () => {
    const appLocales = [{ code: 'pl' }, { code: 'fr' }]
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe(undefined)
  })

  test('matches full locale with mixed short and full, full having highest rank', () => {
    const appLocales = [{ code: 'en-US' }, { code: 'en-GB' }, { code: 'en' }]
    const browserLocales = ['en-GB', 'en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-GB')
  })

  test('matches short locale with mixed short and full, short having highest rank', () => {
    const appLocales = [{ code: 'en-US' }, { code: 'en-GB' }, { code: 'en' }]
    const browserLocales = ['en', 'en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('matches short locale case-insensitively', () => {
    const appLocales = [{ code: 'EN' }, { code: 'en-GB' }]
    const browserLocales = ['en', 'en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('EN')
  })

  test('matches long locale case-insensitively', () => {
    const appLocales = [{ code: 'en-gb' }, { code: 'en-US' }]
    const browserLocales = ['en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-gb')
  })

  test('matches ISO locale code', () => {
    const appLocales = [{ code: 'cn', iso: 'zh-CN' }, { code: 'en', iso: 'en-US' }]
    const browserLocales = ['zh', 'zh-CN']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('cn')
  })

  test('matches full ISO code', () => {
    const appLocales = [{ code: 'us', iso: 'en-US' }, { code: 'gb', iso: 'en-GB' }]
    const browserLocales = ['en-GB', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('gb')
  })

  test('matches locale when only languages match', () => {
    const appLocales = [{ code: 'en-GB' }, { code: 'en-US' }]
    const browserLocales = ['en-IN', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-GB')
  })
})

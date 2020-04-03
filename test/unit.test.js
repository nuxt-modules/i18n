import path from 'path'

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
  test('parses browser accept-language', async () => {
    const { parseAcceptLanguage } = await import('../src/templates/utils-common')

    expect(parseAcceptLanguage('en-US,en;q=0.9,nb;q=0.8,no;q=0.7')).toStrictEqual(['en-US', 'en', 'nb', 'no'])
  })
})

describe('matchBrowserLocale', () => {
  test('matches highest-ranked full locale', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    // Both locales match first browser locale - full locale should win.
    const appLocales = ['en', 'en-US', 'en-us']
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-US')

    const appLocales = ['zh-CN', 'zh-cn']
    const browserLocales = ['zh-CN', 'zh']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('zh-CN')

    const appLocales = ['zh-TW', 'zh-tw']
    const browserLocales = ['zh-TW', 'zh-CN', 'zh']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('zh-TW')
  })

  test('matches highest-ranked short locale', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    // Both locales match first browser locale - short locale should win.
    // This is because browser locale order defines scoring so we prefer higher-scored over exact.
    const appLocales = ['en', 'en-US', 'en-us']
    const browserLocales = ['en', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')

    const appLocales = ['zh', 'zh-CN', 'zh-cn']
    const browserLocales = ['zh', 'zh-CN']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('zh')
  })

  test('matches highest-ranked short locale (only short defined)', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    const appLocales = ['en']
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')

    const appLocales = ['zh']
    const browserLocales = ['zh-CN', 'zh-TW', 'zh']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('zh')
  })

  test('matches highest-ranked short locale', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    const appLocales = ['en', 'fr']
    const browserLocales = ['en-US', 'en-GB']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })

  test('does not match any locale', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    const appLocales = ['pl', 'fr']
    const browserLocales = ['en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe(null)
  })

  test('matches full locale with mixed short and full, full having highest rank', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    const appLocales = ['en-US', 'en-GB', 'en']
    const browserLocales = ['en-GB', 'en-US', 'en']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en-GB')
  })

  test('matches short locale with mixed short and full, short having highest rank', async () => {
    const { matchBrowserLocale } = await import('../src/templates/utils-common')

    const appLocales = ['en-US', 'en-GB', 'en']
    const browserLocales = ['en', 'en-GB', 'en-US']

    expect(matchBrowserLocale(appLocales, browserLocales)).toBe('en')
  })
})

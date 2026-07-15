import { describe, expect, test } from 'vitest'
import { createLocaleDetector } from '../src/runtime/shared/detection'
import { getLocaleFromRoutePath } from '../src/runtime/kit/routing'

import type { LocaleDetectorConfig } from '../src/runtime/shared/detection'

const LOCALES = ['en', 'fr']

const detectors = (overrides: Partial<ReturnType<typeof createDetectors>> = {}) => ({
  ...createDetectors(),
  ...overrides,
})
const createDetectors = () => ({
  cookie: (): string | undefined => undefined,
  header: (): string | undefined => undefined,
  navigator: (): string | undefined => undefined,
  host: (): string | undefined => undefined,
  route: (path: string | object) => getLocaleFromRoutePath(String(path)),
})

const detection = (overrides: Partial<LocaleDetectorConfig['detection']> = {}) =>
  ({ enabled: true, cookieKey: 'i18n_redirected', ...overrides }) as LocaleDetectorConfig['detection']

function createDetector(overrides: Partial<LocaleDetectorConfig> = {}) {
  return createLocaleDetector({
    detection: detection(),
    isSupportedLocale: locale => LOCALES.includes(locale || ''),
    routing: true,
    domains: false,
    ...overrides,
  })
}

describe('createLocaleDetector', () => {
  test('detection precedence: cookie > header > navigator > fallbackLocale', () => {
    const detect = createDetector({ detection: detection({ fallbackLocale: 'en' }) })
    expect(detect(detectors({ cookie: () => 'fr', header: () => 'en' }), '/', true)).toBe('fr')
    expect(detect(detectors({ header: () => 'fr', navigator: () => 'en' }), '/', true)).toBe('fr')
    expect(detect(detectors({ navigator: () => 'fr' }), '/', true)).toBe('fr')
    expect(detect(detectors(), '/', true)).toBe('en')
  })

  test('unsupported detected locales are skipped', () => {
    const detect = createDetector()
    expect(detect(detectors({ cookie: () => 'xx', header: () => 'fr' }), '/', true)).toBe('fr')
  })

  test('detection sources are only used on the initial detection', () => {
    const detect = createDetector()
    expect(detect(detectors({ cookie: () => 'en' }), '/fr/about', false)).toBe('fr')
    expect(detect(detectors({ cookie: () => 'en' }), '/fr/about', true)).toBe('en')
  })

  test('falls back to the route locale when detection is disabled', () => {
    const detect = createDetector({ detection: detection({ enabled: false }) })
    expect(detect(detectors({ cookie: () => 'en' }), '/fr/about', true)).toBe('fr')
  })

  test("`redirectOn: 'root'` skips detection on other paths", () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'root' }) })
    expect(detect(detectors({ cookie: () => 'fr' }), '/', true)).toBe('fr')
    expect(detect(detectors({ cookie: () => 'fr' }), '/about', true)).toBe('')
    expect(detect(detectors({ cookie: () => 'fr' }), '/en/about', true)).toBe('en')
  })

  test("`redirectOn: 'no prefix'` skips detection on prefixed paths", () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'no prefix' }) })
    expect(detect(detectors({ cookie: () => 'fr' }), '/about', true)).toBe('fr')
    expect(detect(detectors({ cookie: () => 'fr' }), '/en/about', true)).toBe('en')
  })

  test('`alwaysRedirect` detects on prefixed paths', () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'no prefix', alwaysRedirect: true }) })
    expect(detect(detectors({ cookie: () => 'fr' }), '/en/about', true)).toBe('fr')
  })

  test('detection is forced without routing', () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'root' }), routing: false })
    expect(detect(detectors({ cookie: () => 'fr' }), '/about', true)).toBe('fr')
  })

  test('domains: the host locale applies on subsequent detections', () => {
    const detect = createDetector({ domains: true, routing: false })
    expect(detect(detectors({ host: () => 'fr' }), '/', false)).toBe('fr')
  })

  test('domains: the host locale is authoritative over `fallbackLocale`', () => {
    const detect = createDetector({ domains: true, detection: detection({ fallbackLocale: 'en' }) })
    expect(detect(detectors({ host: () => 'fr' }), '/', true)).toBe('fr')
    expect(detect(detectors({ cookie: () => 'en', host: () => 'fr' }), '/', true)).toBe('en')
  })

  test('(#2158) the route locale is not overridden by `fallbackLocale`', () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'all', fallbackLocale: 'en' }) })
    expect(detect(detectors(), '/fr/about', true)).toBe('fr')
    // real detection sources do take precedence over the route locale with `redirectOn: 'all'` (#3752)
    expect(detect(detectors({ cookie: () => 'en' }), '/fr/about', true)).toBe('en')
  })

  test('(#2255) query strings do not affect path-based detection gates', () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'root' }) })
    expect(detect(detectors({ cookie: () => 'fr' }), '/?foo=bar', true)).toBe('fr')
  })

  test('returns an empty string when nothing is detected', () => {
    const detect = createDetector()
    expect(detect(detectors(), '/about', true)).toBe('')
  })
})

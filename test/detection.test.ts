import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createLocaleDetector } from '../src/runtime/shared/detection'
import { getLocaleFromRoute } from '../src/runtime/kit/routing'
import { localizeRoutes } from '../src/routing'
import { getNormalizedLocales } from './pages/utils'

import type { LocaleDetectorConfig } from '../src/runtime/shared/detection'
import type { LocalizableRoute } from '../src/kit/gen'
import type { CompatRoute } from '../src/runtime/types'

const LOCALES = ['en', 'fr']

/** Route objects as the app passes them, resolved against the localized route table */
function createRouteResolver() {
  const routes = localizeRoutes([{ path: '/about', name: 'about' }] as LocalizableRoute[], {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: getNormalizedLocales(LOCALES.map(code => ({ code, language: code }))),
    routesNameSeparator: '___',
    defaultLocaleRouteNameSuffix: 'default',
    trailingSlash: false,
  })
  const router = createRouter({ routes: routes as never, history: createMemoryHistory() })
  return (path: string) => router.resolve(path) as CompatRoute
}

const detectors = (overrides: Partial<ReturnType<typeof createDetectors>> = {}) => ({
  ...createDetectors(),
  ...overrides,
})
const createDetectors = () => ({
  cookie: (): string | undefined => undefined,
  header: (): string | undefined => undefined,
  navigator: (): string | undefined => undefined,
  host: (): string | undefined => undefined,
  route: (route: string | CompatRoute) => getLocaleFromRoute(route),
  onHost: (locale: string | null | undefined) => locale,
  fromOwnDomain: () => false,
  cookieSpans: () => false,
})

/** Mirrors `useDetectors().onHost`, which passes a locale through only when the host serves it */
const servedExcept = (restricted: string) => (locale: string | null | undefined) =>
  locale === restricted ? undefined : locale

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

  test("`redirectOn: 'root'` detects on a path without a page or prefix", () => {
    const detect = createDetector({ detection: detection({ redirectOn: 'root' }) })
    const resolve = createRouteResolver()
    // e.g. a missing asset rendering the error page, the default locale would replace the stored one
    expect(detect(detectors({ cookie: () => 'fr' }), resolve('/missing.png'), true)).toBe('fr')
    expect(detect(detectors({ cookie: () => 'en' }), resolve('/fr/missing.png'), true)).toBe('fr')
    expect(detect(detectors({ cookie: () => 'fr' }), resolve('/about'), true)).toBe('en')
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

  test('domains: a browser locale another domain serves is adopted', () => {
    const detect = createDetector({ domains: true })
    const onHost = servedExcept('en')
    expect(detect(detectors({ header: () => 'en', host: () => 'fr', onHost }), '/', true)).toBe('en')
    expect(detect(detectors({ navigator: () => 'en', host: () => 'fr', onHost }), '/', true)).toBe('en')
  })

  test('domains: a cookie locale another domain serves falls through to the host locale', () => {
    // a per-host cookie can disagree with the target domain's detection, following it
    // off-host would have the two hosts redirect at each other indefinitely
    const detect = createDetector({ domains: true })
    const onHost = servedExcept('en')
    expect(detect(detectors({ cookie: () => 'en', host: () => 'fr', onHost }), '/', true)).toBe('fr')
  })

  test('domains: a cookie locale is followed off-host when the cookie spans the domains', () => {
    const detect = createDetector({ domains: true })
    const onHost = servedExcept('en')
    expect(detect(detectors({ cookie: () => 'en', host: () => 'fr', onHost, cookieSpans: () => true }), '/', true)).toBe('en')
  })

  test('domains: a `cookieDomain` not covering every domain keeps the cookie on-host', () => {
    // following it would bounce the visitor between hosts that cannot read each other's cookie
    const detect = createDetector({ domains: true, detection: detection({ cookieDomain: '.mysite.com' }) })
    const onHost = servedExcept('en')
    expect(detect(detectors({ cookie: () => 'en', host: () => 'fr', onHost }), '/', true)).toBe('fr')
  })

  test('domains: an arrival from a configured domain stays on the host it chose', () => {
    const detect = createDetector({ domains: true })
    const onHost = servedExcept('en')
    const overrides = { host: () => 'fr', onHost, fromOwnDomain: () => true, cookieSpans: () => true }
    expect(detect(detectors({ cookie: () => 'en', ...overrides }), '/', true)).toBe('fr')
    expect(detect(detectors({ header: () => 'en', ...overrides }), '/', true)).toBe('fr')
    expect(detect(detectors({ navigator: () => 'en', ...overrides }), '/', true)).toBe('fr')
  })

  test('domains: a `fallbackLocale` the host does not serve is not adopted', () => {
    const detect = createDetector({ domains: true, detection: detection({ fallbackLocale: 'en' }) })
    expect(detect(detectors({ host: () => undefined, onHost: servedExcept('en') }), '/', true)).toBe('')
  })

  test('browser locales are unrestricted without domain routing', () => {
    const detect = createDetector({ domains: false })
    expect(detect(detectors({ cookie: () => 'fr', onHost: () => undefined }), '/', true)).toBe('fr')
  })

  test('domains: the restriction does not apply to the route locale', () => {
    const detect = createDetector({ domains: true, detection: detection({ redirectOn: 'all' }) })
    expect(detect(detectors({ host: () => undefined, onHost: servedExcept('fr') }), '/fr/about', true)).toBe('fr')
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

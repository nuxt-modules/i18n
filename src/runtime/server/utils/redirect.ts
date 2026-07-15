import { parsePath } from 'ufo'
import { isSupportedLocale } from '../../shared/locales'

import type { Strategies } from '#internal-i18n-types'
import type { useDetectors } from '../../shared/detection'
import type { useI18nDetection } from '../../shared/utils'

type Detectors = ReturnType<typeof useDetectors>

export type RedirectResolverConfig = {
  detection: ReturnType<typeof useI18nDetection>
  rootRedirect?: { path: string, code: number }
  redirectStatusCode?: number
  /** Resolves the localized variant of a path, returns `undefined` when it cannot be matched */
  matchLocalized: (path: string, locale: string, defaultLocale: string) => string | undefined
  /** @default `isSupportedLocale` */
  isSupportedLocale?: (locale?: string) => boolean
  /** @default `__I18N_STRATEGY__` */
  strategy?: Strategies
  /** Whether routes are localized (pages enabled and strategy is not `no_prefix`) @default `__I18N_ROUTING__` */
  routing?: boolean
  /** Whether locales are resolved from domains @default `__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__` */
  domains?: boolean
}

export type ResolvedRedirect = { path: string | undefined, code: number, locale: string }

export function createRedirectResolver(config: RedirectResolverConfig) {
  const { detection, rootRedirect, matchLocalized } = config
  const isSupported = config.isSupportedLocale ?? isSupportedLocale
  const strategy = config.strategy ?? __I18N_STRATEGY__
  const routing = config.routing ?? __I18N_ROUTING__
  const domains = config.domains ?? (__DIFFERENT_DOMAINS__ || __MULTI_DOMAIN_LOCALES__)

  function* detect(detectors: Detectors, path: string) {
    if (detection.enabled) {
      yield detectors.cookie()
      yield detectors.header()
    }

    if (domains) {
      yield detectors.host(path)
    }

    if (routing) {
      yield detectors.route(path)
    }

    yield detection.fallbackLocale
  }

  /**
   * Resolves the redirect for a request, `fullPath` may contain a query string while
   * `path` is the base- and prefix-free route path.
   */
  return function resolveRedirectPath(
    fullPath: string,
    path: string | undefined,
    pathLocale: string | undefined,
    defaultLocale: string,
    detectors: Detectors,
  ): ResolvedRedirect {
    let locale = ''
    for (const detected of detect(detectors, fullPath)) {
      if (detected && isSupported(detected)) {
        locale = detected
        break
      }
    }
    locale ||= defaultLocale

    function getLocalizedMatch(locale: string) {
      const res = matchLocalized(path || '/', locale, defaultLocale)
      if (res && res !== fullPath) {
        return res
      }
    }

    let resolvedPath: string | undefined = undefined
    let redirectCode = 302

    // base-free pathname, `getRequestURL(event).pathname` would still contain `app.baseURL`
    const pathname = parsePath(fullPath).pathname
    if (rootRedirect && pathname === '/') {
      locale = (detection.enabled && locale) || defaultLocale
      resolvedPath
        = (isSupported(detectors.route(rootRedirect.path)) && rootRedirect.path)
          || matchLocalized(rootRedirect.path, locale, defaultLocale)
      redirectCode = rootRedirect.code
    } else if (config.redirectStatusCode) {
      redirectCode = config.redirectStatusCode
    }

    switch (detection.redirectOn) {
      case 'root':
        if (pathname !== '/') { break }
      // fallthrough (root has no prefix)
      case 'no prefix':
        if (pathLocale) { break }
      // fallthrough to resolve
      case 'all':
        resolvedPath ??= getLocalizedMatch(locale)
        break
    }

    if (pathname === '/' && strategy === 'prefix') {
      resolvedPath ??= getLocalizedMatch(defaultLocale)
    }
    return { path: resolvedPath, code: redirectCode, locale }
  }
}

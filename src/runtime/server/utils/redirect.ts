import { parsePath } from 'ufo'
import { createLocaleDetector } from '../../shared/detection'
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
  strategy: Strategies
  /** Whether routes are localized (pages enabled and strategy is not `no_prefix`) */
  routing: boolean
  /** Whether locales are resolved from domains */
  domains: boolean
  /** `multiDomainLocales: { isolate: true }`, forwarded to `createLocaleDetector` */
  isolate?: boolean
}

/** `origin` is set when the redirect moves to another domain, a relative redirect otherwise */
export type ResolvedRedirect = { path: string | undefined, code: number, locale: string, origin?: string }

export function createRedirectResolver(config: RedirectResolverConfig) {
  const { detection, rootRedirect, matchLocalized, strategy, routing, domains, isolate } = config
  const isSupported = config.isSupportedLocale ?? isSupportedLocale
  const detectLocale = createLocaleDetector({ detection, isSupportedLocale: isSupported, routing, domains, isolate })

  /**
   * Resolves the redirect for a request, `fullPath` may contain a query string while
   * `path` is the base- and prefix-free route path. `relocate` resolves the cross-domain
   * redirect for a locale the current host does not serve.
   */
  return function resolveRedirectPath(
    fullPath: string,
    path: string | undefined,
    pathLocale: string | undefined,
    defaultLocale: string,
    detectors: Detectors,
    relocate?: (locale: string) => ResolvedRedirect | undefined,
  ): ResolvedRedirect {
    // a path locale restricted to other domains moves to a domain serving it before detection
    // gets to strip the prefix and keep the request here in another locale. Isolated domains
    // never relocate, an unmatchable route 404s instead (see `pruneOffHostRoutes`)
    if (routing && domains && !isolate && pathLocale && !detectors.onHost(pathLocale)) {
      const relocated = relocate?.(pathLocale)
      if (relocated) { return relocated }
    }

    // the server handles fresh requests, detection is always `initial`
    let locale = detectLocale(detectors, fullPath, true) || defaultLocale

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

    // a detected locale served by another domain redirects there directly, shaped for that
    // domain's default locale, instead of localizing here and relocating again
    if (domains && !isolate && !detectors.onHost(locale)) {
      const relocated = relocate?.(locale)
      if (relocated) { return relocated }
    }

    return { path: resolvedPath, code: redirectCode, locale }
  }
}

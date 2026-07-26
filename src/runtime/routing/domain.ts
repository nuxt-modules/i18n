import type { Router } from 'vue-router'
import type { LocaleObject, Strategies } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { normalizedLocales } from '#build/i18n-options.mjs'
import { defaultRouteNameSuffix, getLocaleFromRouteName } from '#i18n-kit/routing'
import { isLocaleOnHost } from '../shared/domain'

/**
 * Rebuilds the route table for the current domain: drops routes for locales that aren't
 * served on this host so they 404 instead of silently rendering under the wrong locale and
 * URL. Under `prefix_except_default`/`prefix_and_default` it also removes the generated
 * `___default` variants and unprefixes the routes of the domain's default locale, since only
 * those two strategies have an unprefixed default locale that needs adjusting per domain.
 * `no_prefix` is skipped entirely: it only supports one locale per domain, so there's nothing
 * to remove. Used by both `differentDomains` and `multiDomainLocales`.
 */
export function setupMultiDomainLocales(
  defaultLocale: string,
  strategy: Strategies,
  router: Router = useRouter(),
  locales: LocaleObject[] = normalizedLocales,
  host?: string,
) {
  if (strategy === 'no_prefix') { return }
  const usesDefaultVariants = strategy === 'prefix_except_default' || strategy === 'prefix_and_default'

  // only restrict routes to the host's own locales when the host is itself one of the
  // recognized domains. An unrecognized host, just falls back to serving every locale,
  // as if nothing were restricted
  const configuredHost = host && locales.some(l => isLocaleOnHost(l, host)) ? host : undefined
  const localesByCode = configuredHost && new Map(locales.map(l => [l.code, l]))
  const prefixPatterns = new Map<string, RegExp>()

  // adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = String(route.name)
    if (usesDefaultVariants && routeName.endsWith(defaultRouteNameSuffix)) {
      router.removeRoute(routeName)
      continue
    }

    const locale = getLocaleFromRouteName(routeName)

    if (configuredHost && localesByCode) {
      const localeConfig = localesByCode.get(locale)
      // only locales that opted into domain restriction (they have `domain` or `domains`
      // configured) get checked against the host, a locale with neither is treated as
      // available everywhere
      if (localeConfig && (localeConfig.domain || localeConfig.domains?.length) && !isLocaleOnHost(localeConfig, configuredHost)) {
        router.removeRoute(routeName)
        continue
      }
    }

    // `prefix` always keeps every locale prefixed, there's no per-domain default to adjust
    if (!usesDefaultVariants) { continue }

    // content path regardless of locale, it may still be unprefixed just because it was
    // the *build time* default locale, so it needs to be re-prefixed here if a different
    // locale turns out to be this domain's actual default
    let prefixPattern = prefixPatterns.get(locale)
    if (!prefixPattern) {
      prefixPattern = new RegExp(`^/${locale}/?`)
      prefixPatterns.set(locale, prefixPattern)
    }
    const contentPath = route.path.replace(prefixPattern, '/')
    const path = locale === defaultLocale ? contentPath : contentPath === '/' ? `/${locale}` : `/${locale}${contentPath}`

    if (path !== route.path) {
      router.addRoute({ ...route, path })
    }
  }
}

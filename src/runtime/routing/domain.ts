import type { Router } from 'vue-router'
import type { NormalizedLocaleObject, Strategies } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { defaultRouteNameSuffix, getLocaleFromRouteName } from '#i18n-kit/routing'
import { isLocaleServedOnHost } from '../shared/domain'

/**
 * Rebuilds the route table for the current domain from the `___default` variants generated for
 * every domain default. Used by both `differentDomains` and `multiDomainLocales` under the
 * `*_default` strategies.
 */
export function setupMultiDomainLocales(defaultLocale: string, strategy: Strategies, router: Router = useRouter()) {
  if (strategy !== 'prefix_except_default' && strategy !== 'prefix_and_default') { return }

  // `prefix_and_default` serves its default locale both unprefixed and prefixed, so the host's
  // own variant is kept. The build only emits variants for locales that are a domain default
  // somewhere, so when the host default has none the prefixed route is unprefixed instead
  const keepsDefaultVariant = strategy === 'prefix_and_default'
    && router.getRoutes().some((route) => {
      const routeName = String(route.name)
      return routeName.endsWith(defaultRouteNameSuffix) && getLocaleFromRouteName(routeName) === defaultLocale
    })

  // adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = String(route.name)
    const locale = getLocaleFromRouteName(routeName)

    if (routeName.endsWith(defaultRouteNameSuffix)) {
      if (!keepsDefaultVariant || locale !== defaultLocale) {
        router.removeRoute(routeName)
      }
      continue
    }

    if (!keepsDefaultVariant && locale === defaultLocale) {
      router.addRoute({ ...route, path: route.path.replace(new RegExp(`^/${locale}/?`), '/') })
    }
  }
}

/**
 * Removes every route whose locale isn't served on `host`. Kept separate from
 * `setupMultiDomainLocales` since that only adjusts routes for the `*_default` strategies, and
 * this has to run for every strategy. Used by `multiDomainLocales: { isolate: true }`: an off-host
 * route becomes unmatchable, so both the initial SSR request and any later client-side navigation
 * to it resolve as a 404 instead of ever being reachable on this host.
 */
export function pruneOffHostRoutes(locales: NormalizedLocaleObject[], host: string, router: Router = useRouter()) {
  for (const route of router.getRoutes()) {
    const routeName = String(route.name)
    const locale = getLocaleFromRouteName(routeName)
    if (locale && !isLocaleServedOnHost(locales, host, locale)) {
      router.removeRoute(routeName)
    }
  }
}

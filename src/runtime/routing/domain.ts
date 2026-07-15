import type { Router } from 'vue-router'
import type { Strategies } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { defaultRouteNameSuffix, getLocaleFromRouteName } from '#i18n-kit/routing'

/**
 * Rebuilds the route table for the current domain: removes the generated `___default`
 * variants and unprefixes the routes of the domain's default locale. Used by both
 * `differentDomains` and `multiDomainLocales` under the `*_default` strategies.
 */
export function setupMultiDomainLocales(defaultLocale: string, strategy: Strategies, router: Router = useRouter()) {
  if (strategy !== 'prefix_except_default' && strategy !== 'prefix_and_default') { return }

  // adjust routes to match the domain's locale and structure
  for (const route of router.getRoutes()) {
    const routeName = String(route.name)
    if (routeName.endsWith(defaultRouteNameSuffix)) {
      router.removeRoute(routeName)
      continue
    }

    const locale = getLocaleFromRouteName(routeName)
    if (locale === defaultLocale) {
      router.addRoute({ ...route, path: route.path.replace(new RegExp(`^/${locale}/?`), '/') })
    }
  }
}

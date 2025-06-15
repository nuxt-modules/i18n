import type { Router } from 'vue-router'
import { useRouter } from '#imports'
import { defaultRouteNameSuffix, getLocaleFromRouteName } from '#i18n-kit/routing'

/**
 * Removes default routes depending on domain
 */
export function setupMultiDomainLocales(defaultLocale: string, router: Router = useRouter()) {
  if (__I18N_STRATEGY__ !== 'prefix_except_default' && __I18N_STRATEGY__ !== 'prefix_and_default') return

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

import type { Router } from 'vue-router'
import type { NormalizedLocaleObject } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { localeCodes } from '#build/i18n-options.mjs'
import { getLocaleFromRouteName } from '#i18n-kit/routing'

/**
 * Removes the routes of locales an `i18n:request-config` nitro hook disabled for this request,
 * so a disabled locale's prefix 404s instead of serving content the config says does not exist.
 * Follows the `setupMultiDomainLocales` pattern: the server router is request-scoped and the
 * client rebuilds from the payload config, so both derive the same table.
 */
export function pruneDisabledLocaleRoutes(effective: NormalizedLocaleObject[], router: Router = useRouter()) {
  if (effective.length === localeCodes.length) { return }

  const enabled = new Set(effective.map(l => l.code))
  for (const route of router.getRoutes()) {
    const locale = getLocaleFromRouteName(String(route.name))
    if (locale && !enabled.has(locale)) {
      router.removeRoute(route.name!)
    }
  }
}

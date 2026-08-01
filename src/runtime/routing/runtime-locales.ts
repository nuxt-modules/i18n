import type { Router } from 'vue-router'
import type { NormalizedLocaleObject } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { localeCodes } from '#build/i18n-options.mjs'
import { getLocaleFromRouteName } from '#i18n-kit/routing'

/**
 * Removes the routes of locales this request does not serve, so their prefixes 404 instead of
 * serving content the request's config says does not exist.
 */
export function pruneUnservedLocaleRoutes(locales: NormalizedLocaleObject[], router: Router = useRouter()) {
  if (locales.length === localeCodes.length) { return }

  const served = new Set(locales.map(l => l.code))
  for (const route of router.getRoutes()) {
    const locale = getLocaleFromRouteName(String(route.name))
    if (locale && !served.has(locale)) {
      router.removeRoute(route.name!)
    }
  }
}

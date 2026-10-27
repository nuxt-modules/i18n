import type { RouteRecordNormalized, RouteRecordRaw, Router } from 'vue-router'
import type { Strategies } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { defaultRouteNameSuffix, getLocaleFromRouteName, getLocaleFromRoutePath } from '#i18n-kit/routing'
import { toArray } from '../shared/utils'

export function setupMultiDomainLocales(defaultLocale: string, strategy: Strategies, router: Router = useRouter()) {
  if (strategy !== 'prefix_except_default' && strategy !== 'prefix_and_default') { return }

  const routes = router.getRoutes()

  // `prefix_and_default` serves its default locale both unprefixed and prefixed, so the host's
  // own variant is kept. The build only emits variants for locales that are a domain default
  // somewhere, so when the host default has none the prefixed route is unprefixed instead
  const keepsDefaultVariant = strategy === 'prefix_and_default'
    && routes.some((route) => {
      const routeName = String(route.name)
      return routeName.endsWith(defaultRouteNameSuffix) && getLocaleFromRouteName(routeName) === defaultLocale
    })

  const actionFor = (route: RouteRecordNormalized) => {
    const routeName = String(route.name)
    const locale = getLocaleFromRouteName(routeName)
    if (routeName.endsWith(defaultRouteNameSuffix)) {
      return !keepsDefaultVariant || locale !== defaultLocale ? 'remove' : undefined
    }
    return !keepsDefaultVariant && locale === defaultLocale ? 'unprefix' : undefined
  }

  // `getRoutes()` lists each alias as its own record, named like the record it aliases. Re-adding
  // either one by name removes the other, so collect the aliases first and re-add them with their record
  const aliases = new Map<RouteRecordNormalized, string[]>()
  const records: RouteRecordNormalized[] = []
  for (const route of routes) {
    if (!route.aliasOf) {
      records.push(route)
      continue
    }
    const paths = aliases.get(route.aliasOf)
    if (paths) { paths.push(route.path) } else { aliases.set(route.aliasOf, [route.path]) }
  }

  // `removeRoute` and `addRoute` also handle a record's children, so the loop skips them
  const nested = new Set(records.filter(actionFor).flatMap(route => descendantNames(route.children)))

  const unprefix = (path: string) =>
    path.startsWith('/') && getLocaleFromRoutePath(path) === defaultLocale
      ? path.slice(defaultLocale.length + 1) || '/'
      : path

  for (const route of records) {
    const routeName = String(route.name)
    if (nested.has(routeName)) { continue }

    const action = actionFor(route)
    if (action === 'remove') {
      router.removeRoute(routeName)
    } else if (action === 'unprefix') {
      router.addRoute(withoutLocalePrefix({ ...route, alias: aliases.get(route) ?? [] }, unprefix))
    }
  }
}

function descendantNames(children: RouteRecordRaw[] = []): string[] {
  return children.flatMap(child => [...(child.name ? [String(child.name)] : []), ...descendantNames(child.children)])
}

function withoutLocalePrefix(route: RouteRecordRaw, unprefix: (path: string) => string): RouteRecordRaw {
  const unprefixed = { ...route, path: unprefix(route.path) }
  if (route.alias != null) {
    unprefixed.alias = toArray(route.alias).map(unprefix)
  }
  if (route.children) {
    unprefixed.children = route.children.map(child => withoutLocalePrefix(child, unprefix))
  }
  return unprefixed as RouteRecordRaw
}

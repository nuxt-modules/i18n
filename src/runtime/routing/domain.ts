import type { RouteRecordRaw, Router } from 'vue-router'
import type { Strategies } from '#internal-i18n-types'
import { useRouter } from '#imports'
import { defaultRouteNameSuffix, getLocaleFromRouteName } from '#i18n-kit/routing'

const domainRouteTables = new WeakMap<readonly RouteRecordRaw[], Map<string, RouteRecordRaw[]>>()
const domainRouteTableLocales = new WeakMap<readonly RouteRecordRaw[], string>()

const isDefaultVariant = (name: unknown) => String(name).endsWith(defaultRouteNameSuffix)

function hasDefaultVariant(routes: readonly RouteRecordRaw[], locale: string): boolean {
  return routes.some(route =>
    (isDefaultVariant(route.name) && getLocaleFromRouteName(String(route.name)) === locale)
    || (route.children != null && hasDefaultVariant(route.children, locale)),
  )
}

function pruneDefaultVariants(routes: readonly RouteRecordRaw[], keep: (name: string) => boolean): RouteRecordRaw[] {
  const pruned: RouteRecordRaw[] = []
  for (const route of routes) {
    if (isDefaultVariant(route.name) && !keep(String(route.name))) { continue }
    pruned.push(route.children ? { ...route, children: pruneDefaultVariants(route.children, keep) } : route)
  }
  return pruned
}

function createDomainRoutes(routes: readonly RouteRecordRaw[], defaultLocale: string, strategy: Strategies): RouteRecordRaw[] {
  // `prefix_and_default` serves its default locale both unprefixed and prefixed, so the host's
  // own variant is kept. The build only emits variants for locales that are a domain default
  // somewhere, so when the host default has none the prefixed route is unprefixed instead
  const keepsDefaultVariant = strategy === 'prefix_and_default' && hasDefaultVariant(routes, defaultLocale)
  const table = pruneDefaultVariants(routes, name => keepsDefaultVariant && getLocaleFromRouteName(name) === defaultLocale)
  if (keepsDefaultVariant) { return table }

  const prefix = new RegExp(`^/${defaultLocale}/?`)
  const unprefix = (path: string) => path.replace(prefix, '/')
  const prefixed: RouteRecordRaw[] = []
  const unprefixed: RouteRecordRaw[] = []
  for (const route of table) {
    if (getLocaleFromRouteName(String(route.name)) !== defaultLocale) {
      prefixed.push(route)
      continue
    }
    const record = { ...route, path: unprefix(route.path) } as RouteRecordRaw
    if (route.alias != null) {
      record.alias = Array.isArray(route.alias) ? route.alias.map(unprefix) : unprefix(route.alias)
    }
    unprefixed.push(record)
  }
  return [...prefixed, ...unprefixed]
}

/**
 * Returns the route table for a host whose unprefixed locale is `defaultLocale`, built from the
 * `___default` variants generated for every domain default. Used by both `differentDomains` and
 * `multiDomainLocales` under the `*_default` strategies.
 *
 * Tables are cached per source array and locale, so every host with the same unprefixed locale
 * receives the same array.
 */
export function resolveDomainRoutes(routes: readonly RouteRecordRaw[], defaultLocale: string, strategy: Strategies): readonly RouteRecordRaw[] {
  if (strategy !== 'prefix_except_default' && strategy !== 'prefix_and_default') { return routes }

  let tables = domainRouteTables.get(routes)
  if (!tables) {
    tables = new Map()
    domainRouteTables.set(routes, tables)
  }

  const key = strategy + ':' + defaultLocale
  let table = tables.get(key)
  if (!table) {
    table = createDomainRoutes(routes, defaultLocale, strategy)
    tables.set(key, table)
    domainRouteTableLocales.set(table, defaultLocale)
  }
  return table
}

/**
 * Rebuilds the route table of an existing router for the current domain. Only applies when the
 * app replaces the `routes` router option; a router created from {@link resolveDomainRoutes} for
 * `defaultLocale` is left untouched.
 */
export function setupMultiDomainLocales(defaultLocale: string, strategy: Strategies, router: Router = useRouter()) {
  if (strategy !== 'prefix_except_default' && strategy !== 'prefix_and_default') { return }
  if (domainRouteTableLocales.get(router.options.routes) === defaultLocale) { return }

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

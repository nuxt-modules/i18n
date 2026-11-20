import type { RouteRecordRaw, Router } from 'vue-router'
import type { Strategies } from '#internal-i18n-types'
import { defaultRouteNameSuffix, getLocaleFromRouteName } from '#i18n-kit/routing'

const domainRouteTables = new WeakMap<readonly RouteRecordRaw[], Map<string, RouteRecordRaw[]>>()
const domainRouteTableLocales = new WeakMap<readonly RouteRecordRaw[], string>()

const isDefaultVariant = (name: unknown) => String(name).endsWith(defaultRouteNameSuffix)

/** A parent with an index child has no name, its first named descendant tells which tree it belongs to */
function routeName(route: RouteRecordRaw): string {
  if (route.name) { return String(route.name) }
  for (const child of route.children ?? []) {
    const name = routeName(child)
    if (name) { return name }
  }
  return ''
}

function hasDefaultVariant(routes: readonly RouteRecordRaw[], locale: string): boolean {
  return routes.some((route) => {
    const name = routeName(route)
    return isDefaultVariant(name) && getLocaleFromRouteName(name) === locale
  })
}

function createHostRules(routes: readonly RouteRecordRaw[], defaultLocale: string, strategy: Strategies) {
  const isHostLocale = (name: unknown) => getLocaleFromRouteName(String(name)) === defaultLocale
  // `prefix_and_default` serves its default locale both unprefixed and prefixed, so the host's
  // own variant is kept. The build only emits variants for locales that are a domain default
  // somewhere, so when the host default has none the prefixed route is unprefixed instead
  const keepsDefaultVariant = strategy === 'prefix_and_default' && hasDefaultVariant(routes, defaultLocale)
  const prefix = new RegExp(`^/${defaultLocale}/?`)
  const unprefix = (path: string) => path.replace(prefix, '/')

  return {
    /** A `___default` variant this host does not serve */
    prunes: (name: unknown) => isDefaultVariant(name) && !(keepsDefaultVariant && isHostLocale(name)),
    /** A prefixed route of the host's own locale, served unprefixed here */
    unprefixes: (name: unknown) => !keepsDefaultVariant && !isDefaultVariant(name) && isHostLocale(name),
    unprefixRoute(route: RouteRecordRaw): RouteRecordRaw {
      const record = { ...route, path: unprefix(route.path) } as RouteRecordRaw
      if (route.alias != null) {
        record.alias = Array.isArray(route.alias) ? route.alias.map(unprefix) : unprefix(route.alias)
      }
      return record
    },
  }
}

function createDomainRoutes(routes: readonly RouteRecordRaw[], defaultLocale: string, strategy: Strategies): RouteRecordRaw[] {
  const rules = createHostRules(routes, defaultLocale, strategy)
  const prefixed: RouteRecordRaw[] = []
  const unprefixed: RouteRecordRaw[] = []
  for (const route of routes) {
    const name = routeName(route)
    if (rules.prunes(name)) { continue }
    if (rules.unprefixes(name)) { unprefixed.push(rules.unprefixRoute(route)) } else { prefixed.push(route) }
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
export function setupMultiDomainLocales(defaultLocale: string, strategy: Strategies, router: Router) {
  if (strategy !== 'prefix_except_default' && strategy !== 'prefix_and_default') { return }
  // an app without pages runs Nuxt's built-in router, which has no route table
  const routes = router.options.routes as readonly RouteRecordRaw[] | undefined
  if (!routes || domainRouteTableLocales.get(routes) === defaultLocale) { return }

  const rules = createHostRules(routes, defaultLocale, strategy)
  // the live matcher lists nested routes too, so variants under any parent are found by name
  for (const route of router.getRoutes()) {
    if (rules.prunes(route.name)) { router.removeRoute(route.name!) }
  }
  // raw records still have the `alias` and `children` a matcher record has lost
  for (const route of routes) {
    const name = routeName(route)
    // a route the app has removed stays removed
    if (rules.unprefixes(name) && router.hasRoute(name)) { router.addRoute(rules.unprefixRoute(route)) }
  }
}

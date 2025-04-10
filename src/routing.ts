import { toArray } from './utils'
import { getLocalizedRouteName as localizeRouteName } from './runtime/kit/routing'

import type { NuxtPage } from '@nuxt/schema'
import type { LocaleObject, Strategies } from './types'

const join = (...args: (string | undefined)[]) => args.filter(Boolean).join('')

/**
 * Options used during route localization in {@link localizeRoutes}
 */
export interface ComputedRouteOptions {
  locales: readonly string[]
  paths: Record<string, string>
}

/**
 * Resolver for route localization options
 */
export type RouteOptionsResolver = (route: NuxtPage, localeCodes: string[]) => ComputedRouteOptions | undefined

type LocalizeRouteParams = {
  /** locales to use for localization */
  locales: string[]
  /** indicates whether this is a default route for 'prefix_and_default' strategy */
  defaultTree: boolean
  /** parent route */
  parent?: NuxtPage
  /** localized parent route path */
  parentLocalizedPath?: string
}

function handlePathNesting(localizedPath: string, parentLocalizedPath: string = '') {
  if (!parentLocalizedPath) return localizedPath
  // handle parent/index
  const path = localizedPath.replace(parentLocalizedPath + '/', '')
  if (path === parentLocalizedPath) {
    return localizedPath === parentLocalizedPath ? '' : localizedPath
  }
  return path
}

function createShouldPrefix(ctx: RouteContext) {
  if (ctx.strategy === 'no_prefix') return () => false
  return (parent: NuxtPage | undefined, path: string, locale: string, extra = false) => {
    if (extra) return false
    // child route with relative path
    if (parent != null && !path.startsWith('/')) return false
    if (ctx.isDefaultLocale(locale) && ctx.strategy === 'prefix_except_default') return false
    return true
  }
}

function createHandleTrailingSlash(ctx: RouteContext) {
  return (localizedPath: string, hasParent: boolean) => {
    if (!localizedPath) return ''
    const isChildWithRelativePath = hasParent && !localizedPath.startsWith('/')
    return localizedPath.replace(/\/+$/, '') + (ctx.trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
  }
}

function createLocalizeAliases(ctx: RouteContext) {
  return (localized: NuxtPage, locale: string, options: LocalizeRouteParams) => {
    const aliases = toArray(localized.alias).filter(Boolean) as string[]
    const localizedAliases: string[] = []
    for (const alias of aliases) {
      let localizedAlias = ctx.handleTrailingSlash(alias, !!options.parent)
      if (ctx.shouldPrefix(options.parent, alias, locale, options.defaultTree)) {
        localizedAlias = join('/', locale, localizedAlias)
      }
      localizedAliases.push(localizedAlias)
    }
    return localizedAliases
  }
}

function createLocalizeChildren(ctx: RouteContext) {
  return (route: NuxtPage, localized: NuxtPage, locale: string, opts: LocalizeRouteParams) => {
    const localizeParams = {
      parent: route,
      locales: [locale],
      defaultTree: opts.defaultTree,
      parentLocalizedPath: localized.path
    }
    let children: NuxtPage[] = []
    for (const child of route.children!) {
      children = children.concat(localizeSingleRoute(child, localizeParams, ctx))
    }
    return children
  }
}

function createShouldAddDefaultTree(ctx: RouteContext) {
  if (ctx.strategy !== 'prefix_and_default') return () => false
  return (options: LocalizeRouteParams, locale: string) =>
    ctx.isDefaultLocale(locale) && !options.defaultTree && options.parent == null
}

function createShouldAddUnprefixedFallback(ctx: RouteContext) {
  if (ctx.strategy !== 'prefix') return () => false
  return (locale: string) => ctx.isDefaultLocale(locale) && ctx.includeUnprefixedFallback
}

function localizeSingleRoute(route: NuxtPage, options: LocalizeRouteParams, ctx: RouteContext): NuxtPage[] {
  // skip route localization
  if (route.redirect && !route.file) {
    return [route]
  }

  // resolve custom route (config/page) options
  const routeOptions = ctx.optionsResolver(route, options.locales)
  if (!routeOptions) {
    return [route]
  }

  // process path before adding to resultRoutes
  function addLocalizedRoute(localized: NuxtPage) {
    const path = handlePathNesting(localized.path, options.parentLocalizedPath)
    resultRoutes.push({ ...localized, path: ctx.handleTrailingSlash(path, !!options.parent) })
  }

  const resultRoutes: NuxtPage[] = []
  for (const locale of routeOptions.locales) {
    // use custom path if found
    const unprefixed = handlePathNesting(routeOptions.paths?.[locale] ?? route.path)
    const prefixed = join('/', locale, unprefixed)
    const usePrefix = ctx.shouldPrefix(options.parent, unprefixed, locale, options.defaultTree)

    // add default routes
    if (ctx.shouldAddDefaultTree(options, locale)) {
      const extraRoutes = localizeSingleRoute(route, { ...options, locales: [locale], defaultTree: true }, ctx)
      for (const extraRoute of extraRoutes) {
        addLocalizedRoute(extraRoute)
      }
    }

    // add unprefixed route with default name suffix
    if (usePrefix && ctx.multiDomainLocales) {
      addLocalizedRoute({ ...route, name: ctx.localizeRouteName(route.name!, locale, true), path: unprefixed })
    }

    // add unprefixed fallback route
    if (usePrefix && ctx.shouldAddUnprefixedFallback(locale)) {
      addLocalizedRoute(route)
    }

    // clone and localize
    const localized: NuxtPage = { ...route }
    localized.path = usePrefix ? prefixed : unprefixed
    localized.name &&= ctx.localizeRouteName(localized.name, locale, options.defaultTree)
    localized.alias &&= ctx.localizeAliases(localized, locale, options)
    localized.children &&= ctx.localizeChildren(route, localized, locale, options)
    addLocalizedRoute(localized)
  }

  return resultRoutes
}

function shouldLocalizeRoutes(options: SetupLocalizeRoutesOptions) {
  if (options.strategy !== 'no_prefix') return true
  // no_prefix is only supported when using a separate domain per locale
  if (!options.differentDomains) return false

  // check if domains are used multiple times
  const domains = new Set<string>()
  for (const locale of options.locales) {
    if (!locale.domain) continue
    if (domains.has(locale.domain)) {
      console.error(
        `Cannot use \`strategy: no_prefix\` when using multiple locales on the same domain` +
          ` - found multiple entries with ${locale.domain}`
      )
      return false
    }
    domains.add(locale.domain)
  }

  return true
}

type RouteOptions = {
  strategy: Strategies
  trailingSlash: boolean
  differentDomains: boolean
  multiDomainLocales: boolean
  includeUnprefixedFallback: boolean
}

type RouteContext = RouteOptions & {
  optionsResolver: RouteOptionsResolver
  isDefaultLocale: (locale: string) => boolean
  shouldPrefix: ReturnType<typeof createShouldPrefix>
  shouldAddDefaultTree: ReturnType<typeof createShouldAddDefaultTree>
  shouldAddUnprefixedFallback: ReturnType<typeof createShouldAddUnprefixedFallback>
  localizeAliases: ReturnType<typeof createLocalizeAliases>
  localizeChildren: ReturnType<typeof createLocalizeChildren>
  localizeRouteName: (name: string, locale: string, isDefault: boolean) => string
  handleTrailingSlash: ReturnType<typeof createHandleTrailingSlash>
}

// lenient options to setup localize routes context
type SetupLocalizeRoutesOptions = Partial<RouteOptions> & {
  locales: LocaleObject[]
  routesNameSeparator: string
  defaultLocaleRouteNameSuffix: string
  defaultLocale?: string
  optionsResolver?: RouteOptionsResolver
}

function createRouteContext(options: SetupLocalizeRoutesOptions) {
  let defaultLocales = [options.defaultLocale ?? '']
  if (options.differentDomains) {
    const domainDefaults = options.locales.filter(locale => !!locale.domainDefault).map(locale => locale.code)
    defaultLocales = defaultLocales.concat(domainDefaults)
  }

  // create object to use by reference in factory functions
  const ctx = {} as RouteContext
  ctx.strategy = options.strategy ?? 'prefix_and_default'
  ctx.trailingSlash = options.trailingSlash ?? false
  ctx.differentDomains = options.differentDomains ?? false
  ctx.multiDomainLocales = options.multiDomainLocales ?? false
  ctx.multiDomainLocales &&= options.strategy === 'prefix_except_default' || options.strategy === 'prefix_and_default'
  ctx.includeUnprefixedFallback = options.includeUnprefixedFallback ?? false
  ctx.isDefaultLocale = (locale: string) => defaultLocales.includes(locale)
  ctx.optionsResolver = options?.optionsResolver ?? ((_, locales) => ({ locales, paths: {} }))
  ctx.localizeRouteName = (name, locale, isDefault) =>
    localizeRouteName(name, locale, isDefault, options.routesNameSeparator, options.defaultLocaleRouteNameSuffix)
  ctx.handleTrailingSlash = createHandleTrailingSlash(ctx)
  ctx.shouldPrefix = createShouldPrefix(ctx)
  ctx.shouldAddDefaultTree = createShouldAddDefaultTree(ctx)
  ctx.shouldAddUnprefixedFallback = createShouldAddUnprefixedFallback(ctx)
  ctx.localizeAliases = createLocalizeAliases(ctx)
  ctx.localizeChildren = createLocalizeChildren(ctx)
  return ctx
}

/**
 * Localize routes
 */
export function localizeRoutes(routes: NuxtPage[], options: SetupLocalizeRoutesOptions): NuxtPage[] {
  if (!shouldLocalizeRoutes(options)) return routes

  const ctx = createRouteContext(options)
  const params: LocalizeRouteParams = { locales: options.locales.map(x => x.code), defaultTree: false }

  return routes.flatMap(route => localizeSingleRoute(route, params, ctx))
}

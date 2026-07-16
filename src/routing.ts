import {
  type LocalizableRoute,
  type LocalizeRouteParams,
  type RouteContext,
  type RouteOptionsResolver,
  createRouteContext,
  joinPath,
  localizeSingleRoute,
} from './kit/gen'
import type { LocaleObject, Strategies } from './types'

export type RouteResources = {
  /** plain paths mounted as-is for at least one locale */
  localizedPaths: string[]
  /** per-locale custom paths and disables, locales without an entry use the plain path */
  pathToI18nConfig: Record<string, Record<string, string | false>>
  /** custom localized path to plain path */
  i18nPathToPath: Record<string, string>
  /** paths with localization fully disabled */
  disabledPaths: string[]
}

/**
 * Collects the runtime route resources (`i18n-route-resources.mjs`) during route
 * localization, keyed by the full paths routes actually mount at.
 */
export function createRouteResourcesCollector() {
  const pathToConfig: Record<string, Record<string, string | false>> = {}

  const collect: RouteContext['onLocalize'] = (route, routeOptions, options) => {
    const path = joinPath(options.parentPath, route.path)
    if (routeOptions == null) {
      // only routes with localization explicitly disabled are recorded (not e.g. redirect-only routes)
      if ((route.meta as Record<string, unknown> | undefined)?.i18n === false) {
        const entry = (pathToConfig[path] ??= {})
        for (const locale of options.locales) { entry[locale] ??= false }
      }
      return
    }

    const entry = (pathToConfig[path] ??= {})
    for (const locale of routeOptions.locales) {
      // the walk is top-down, the parent's localized path (unprefixed) is already collected
      const parentPath = options.parentPath ? pathToConfig[options.parentPath]?.[locale] || options.parentPath : undefined
      entry[locale] = joinPath(parentPath, routeOptions.paths[locale] ?? route.path)
    }
    for (const locale of options.locales) { entry[locale] ??= false }
  }

  const toResources = (): RouteResources => {
    const resources: RouteResources = { localizedPaths: [], pathToI18nConfig: {}, i18nPathToPath: {}, disabledPaths: [] }
    for (const [path, entry] of Object.entries(pathToConfig)) {
      // identity localizations (localized path equals the plain path) are kept implicit
      const exceptions: Record<string, string | false> = {}
      let hasIdentity = false
      let hasLocalized = false
      for (const [locale, localized] of Object.entries(entry)) {
        if (localized === path) {
          hasIdentity = hasLocalized = true
          continue
        }
        exceptions[locale] = localized
        if (!localized) { continue }
        resources.i18nPathToPath[localized] = path
        hasLocalized = true
      }
      if (!hasLocalized) {
        resources.disabledPaths.push(path)
        continue
      }
      if (hasIdentity) { resources.localizedPaths.push(path) }
      if (Object.keys(exceptions).length) { resources.pathToI18nConfig[path] = exceptions }
    }
    return resources
  }

  return { collect, toResources }
}

function createShouldPrefix(opts: SetupLocalizeRoutesOptions, ctx: RouteContext) {
  if (opts.strategy === 'no_prefix') { return () => false }
  return (path: string, locale: string, options: LocalizeRouteParams) => {
    if (options.defaultTree) { return false }
    // child route with relative path
    if (options.parent != null && !path.startsWith('/')) { return false }
    if (ctx.isDefaultLocale(locale) && opts.strategy === 'prefix_except_default') { return false }
    return true
  }
}

export function shouldLocalizeRoutes(options: SetupLocalizeRoutesOptions) {
  if (options.strategy !== 'no_prefix') { return true }
  // no_prefix is only supported when using a separate domain per locale
  if (!options.differentDomains) { return false }

  // check if domains are used multiple times
  const domains = new Set<string>()
  for (const locale of options.locales) {
    if (!locale.domain) { continue }
    if (domains.has(locale.domain)) {
      console.error(
        `Cannot use \`strategy: no_prefix\` when using multiple locales on the same domain`
        + ` - found multiple entries with ${locale.domain}`,
      )
      return false
    }
    domains.add(locale.domain)
  }

  return true
}

/**
 * Locales acting as the default (unprefixed) locale for at least one domain,
 * `domainDefault` is read as the unnormalized form of `defaultForDomains`.
 */
function getDomainDefaultLocales(locales: LocaleObject[]): string[] {
  return locales.filter(locale => locale.defaultForDomains?.length || locale.domainDefault).map(locale => locale.code)
}

function resolveDefaultLocales(config: SetupLocalizeRoutesOptions) {
  let defaultLocales = [config.defaultLocale ?? '']
  // under the `*_default` strategies domain defaults use `___default` variants + runtime surgery instead
  const usesDefaultVariants
    = config.strategy === 'prefix_except_default' || config.strategy === 'prefix_and_default'
  if (config.differentDomains && !usesDefaultVariants) {
    defaultLocales = defaultLocales.concat(getDomainDefaultLocales(config.locales))
  }
  return defaultLocales
}

// lenient options to setup localize routes context
type SetupLocalizeRoutesOptions = {
  strategy?: Strategies
  trailingSlash?: boolean
  differentDomains?: boolean
  multiDomainLocales?: boolean
  locales: LocaleObject[]
  routesNameSeparator: string
  defaultLocaleRouteNameSuffix: string
  defaultLocale?: string
  optionsResolver?: RouteOptionsResolver
  compactRoutes?: boolean
  onLocalize?: RouteContext['onLocalize']
}

/**
 * Localize routes
 */
export function localizeRoutes(routes: LocalizableRoute[], config: SetupLocalizeRoutesOptions): LocalizableRoute[] {
  if (!shouldLocalizeRoutes(config)) { return routes }

  const ctx = createRouteContext({
    optionsResolver: config.optionsResolver,
    trailingSlash: config.trailingSlash ?? false,
    defaultLocales: resolveDefaultLocales(config),
    routesNameSeparator: config.routesNameSeparator,
    defaultLocaleRouteNameSuffix: config.defaultLocaleRouteNameSuffix,
    onLocalize: config.onLocalize,
  })

  const strategy = config.strategy ?? 'prefix_and_default'

  /**
   * Compact routes: merge all per-locale routes into a single `/:locale(en|fr)/path` route
   * for routes where all locales share the same path.
   */
  if (
    config.compactRoutes
    && strategy !== 'no_prefix'
    && !config.differentDomains
    && !config.multiDomainLocales
  ) {
    const defaultLocale = config.defaultLocale ?? ''
    ctx.compactRoute = (route, routeOptions, params) => {
      // Skip compaction if the route already defines a :locale param to avoid collisions
      if (route.path.includes(':locale')) {
        return undefined
      }

      const makeRegexRoute = (locales: readonly string[]): LocalizableRoute => {
        const localePattern = locales.join('|')
        const regexPrefix = `/:locale(${localePattern})`
        const regexPath = route.path === '/'
          ? regexPrefix
          : regexPrefix + route.path
        const compacted: LocalizableRoute = {
          ...route,
          path: ctx.handleTrailingSlash(regexPath, !!params.parent),
          meta: { ...(route.meta as Record<string, unknown> ?? {}), __i18nCompact: true },
        }
        // Prefix aliases with the locale regex pattern and normalize trailing slashes
        if (compacted.alias) {
          const aliases = Array.isArray(compacted.alias) ? compacted.alias : [compacted.alias]
          compacted.alias = aliases.map((a) => {
            const aliasPath = regexPrefix + (a.startsWith('/') ? a : '/' + a)
            return ctx.handleTrailingSlash(aliasPath, !!params.parent)
          })
        }
        return compacted
      }

      if (strategy === 'prefix_except_default' && defaultLocale) {
        const result: LocalizableRoute[] = []
        // Unprefixed route for default locale (name: about___en)
        const unprefixed: LocalizableRoute = { ...route }
        unprefixed.name &&= ctx.localizeRouteName(unprefixed, defaultLocale, false)
        // Localize children for the default locale so they get ___en suffixes
        unprefixed.children &&= ctx.localizeChildren(route, unprefixed, defaultLocale, params)
        result.push(unprefixed)
        // Regex route for non-default locales (keeps base name)
        const nonDefault = routeOptions.locales.filter(l => !ctx.isDefaultLocale(l))
        if (nonDefault.length > 0) {
          result.push(makeRegexRoute(nonDefault))
        }
        return result
      }

      if (strategy === 'prefix_and_default' && defaultLocale) {
        // Default tree unprefixed route (name: about___en___default)
        const defaultTree: LocalizableRoute = { ...route }
        defaultTree.name &&= ctx.localizeRouteName(defaultTree, defaultLocale, true)
        // Localize children for the default locale so they get proper suffixes
        defaultTree.children &&= ctx.localizeChildren(route, defaultTree, defaultLocale, { ...params, defaultTree: true })
        // Regex route for all locales (keeps base name)
        return [defaultTree, makeRegexRoute(routeOptions.locales)]
      }

      // prefix strategy: single regex route for all locales (keeps base name)
      return [makeRegexRoute(routeOptions.locales)]
    }
  }

  /**
   * Default tree for prefix_and_default strategy
   */
  if (strategy === 'prefix_and_default') {
    // unshift to preserve test snapshots
    ctx.localizers.unshift({
      enabled: ({ options, locale }) => ctx.isDefaultLocale(locale) && !options.defaultTree && options.parent == null,
      localizer: ({ route, ctx, locale, options }) =>
        localizeSingleRoute(route, { ...options, locales: [locale], defaultTree: true }, ctx),
    })
  }

  /**
   * Unprefixed default routes for multi domain locales
   */
  const domainLocales = (config.multiDomainLocales || config.differentDomains) ?? false
  if (domainLocales && (config.strategy === 'prefix_except_default' || config.strategy === 'prefix_and_default')) {
    // only locales that are the default for some domain need an unprefixed variant,
    // `setupMultiDomainLocales` rebuilds the current domain's default routes from these at runtime
    const domainDefaults = new Set(getDomainDefaultLocales(config.locales))
    // unshift to preserve test snapshots
    ctx.localizers.unshift({
      enabled: ({ usePrefix, locale }) => usePrefix && domainDefaults.has(locale),
      localizer: ({ unprefixed, route, ctx, locale }) => [
        { ...route, name: ctx.localizeRouteName(route, locale, true), path: unprefixed },
      ],
    })
  }

  const locales = config.locales.map(x => x.code)
  const params: LocalizeRouteParams = { locales, defaultTree: false, shouldPrefix: createShouldPrefix(config, ctx) }
  return routes.flatMap(route => localizeSingleRoute(route, params, ctx))
}

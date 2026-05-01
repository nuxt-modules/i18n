import {
  type LocalizableRoute,
  type LocalizeRouteParams,
  type RouteContext,
  type RouteOptionsResolver,
  createRouteContext,
  localizeSingleRoute,
} from './kit/gen'
import type { LocaleObject, Strategies } from './types'

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

function shouldLocalizeRoutes(options: SetupLocalizeRoutesOptions) {
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

function resolveDefaultLocales(config: SetupLocalizeRoutesOptions) {
  let defaultLocales = [config.defaultLocale ?? '']
  if (config.differentDomains) {
    const domainDefaults = config.locales.filter(locale => !!locale.domainDefault).map(locale => locale.code)
    defaultLocales = defaultLocales.concat(domainDefaults)
  }
  return defaultLocales
}

// lenient options to setup localize routes context
type SetupLocalizeRoutesOptions = {
  strategy?: Strategies
  trailingSlash?: boolean
  differentDomains?: boolean
  multiDomainLocales?: boolean
  includeUnprefixedFallback?: boolean
  locales: LocaleObject[]
  routesNameSeparator: string
  defaultLocaleRouteNameSuffix: string
  defaultLocale?: string
  optionsResolver?: RouteOptionsResolver
  compactRoutes?: boolean
}

/**
 * Build a map of locale codes to their custom prefixes
 */
function buildLocalePrefixes(locales: LocaleObject[]): Record<string, string> {
  const prefixes: Record<string, string> = {}
  for (const locale of locales) {
    // Use custom prefix if defined and non-empty, otherwise use locale code
    if (locale.prefix && locale.prefix.length > 0) {
      prefixes[locale.code] = locale.prefix
    }
  }
  return prefixes
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
    localePrefixes: buildLocalePrefixes(config.locales),
    routesNameSeparator: config.routesNameSeparator,
    defaultLocaleRouteNameSuffix: config.defaultLocaleRouteNameSuffix,
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
    && !(strategy === 'prefix' && config.includeUnprefixedFallback)
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
  const multiDomainLocales = config.multiDomainLocales ?? false
  if (multiDomainLocales && (config.strategy === 'prefix_except_default' || config.strategy === 'prefix_and_default')) {
    // unshift to preserve test snapshots
    ctx.localizers.unshift({
      enabled: ({ usePrefix }) => usePrefix,
      localizer: ({ unprefixed, route, ctx, locale }) => [
        { ...route, name: ctx.localizeRouteName(route, locale, true), path: unprefixed },
      ],
    })
  }

  /**
   * Unprefixed fallback routes
   */
  const includeUnprefixedFallback = config.includeUnprefixedFallback ?? false
  if (strategy === 'prefix' && includeUnprefixedFallback) {
    // unshift to preserve test snapshots
    ctx.localizers.unshift({
      enabled: ({ usePrefix, locale }) => usePrefix && ctx.isDefaultLocale(locale),
      localizer: ({ route }) => [route],
    })
  }

  const locales = config.locales.map(x => x.code)
  const params: LocalizeRouteParams = { locales, defaultTree: false, shouldPrefix: createShouldPrefix(config, ctx) }
  return routes.flatMap(route => localizeSingleRoute(route, params, ctx))
}

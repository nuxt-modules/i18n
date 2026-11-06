import {
  type LocalizableRoute,
  type LocalizeRouteParams,
  type RouteContext,
  type RouteOptionsResolver,
  createRouteContext,
  joinPath,
  localizeSingleRoute,
} from './kit/gen'
import type { NormalizedLocaleObject, Strategies } from './types'

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
    // under `localeAgnosticDefaultRoutes` the default locale keeps a prefixed tree as well - the
    // unprefixed one is claimed by whichever locale the deployment defaults to, so exempting the
    // build's own default would leave it with no reachable route at all
    if (ctx.isDefaultLocale(locale) && opts.strategy === 'prefix_except_default'
      && !opts.localeAgnosticDefaultRoutes) {
      return false
    }
    return true
  }
}

export function shouldLocalizeRoutes(options: SetupLocalizeRoutesOptions) {
  if (options.strategy !== 'no_prefix') { return true }

  // without a prefix the host is all that names a locale, and only these options make the runtime
  // resolve one from it (`__I18N_DOMAINS__`) - localizing routes without it leaves them unreachable
  if (!options.differentDomains && !options.multiDomainLocales) { return false }

  // compared by host, as configured domains may include a protocol
  const domains = new Set<string>()
  for (const locale of options.locales) {
    for (const domain of locale.domains) {
      const host = domain.replace(/^https?:\/\//, '')
      if (domains.has(host)) {
        console.error(
          `Cannot use \`strategy: no_prefix\` when using multiple locales on the same domain`
          + ` - found multiple entries with ${domain}.`
          + ` Routes stay unlocalized, so \`switchLocalePath\` and the \`hreflang\`/\`canonical\` tags resolve to nothing.`,
        )
        return false
      }
      domains.add(host)
    }
  }

  // one domain per locale is the requirement, so a domain setup configuring none localizes nothing
  return domains.size > 0
}

/** Locales acting as the default (unprefixed) locale for at least one domain */
function getDomainDefaultLocales(locales: NormalizedLocaleObject[]): string[] {
  return locales.filter(locale => locale.defaultForDomains.length).map(locale => locale.code)
}

const usesDefaultVariants = (strategy: Strategies | undefined) =>
  strategy === 'prefix_except_default' || strategy === 'prefix_and_default'

/**
 * Locales getting an unprefixed `___default` tree alongside their prefixed routes.
 */
function resolveDefaultTreeLocales(config: SetupLocalizeRoutesOptions, strategy: Strategies): string[] {
  if (config.differentDomains || config.multiDomainLocales) {
    // `setupMultiDomainLocales` keeps the current host's variant at runtime
    return usesDefaultVariants(strategy) ? getDomainDefaultLocales(config.locales) : []
  }
  if (!config.defaultLocale) { return [] }
  // `localeAgnosticDefaultRoutes` gives `prefix_except_default` the same two-variant shape
  // `prefix_and_default` has - prefixed plus unprefixed - differing only in that the unprefixed
  // one is named without a locale
  if (strategy === 'prefix_except_default' && config.localeAgnosticDefaultRoutes) {
    return [config.defaultLocale]
  }
  return strategy === 'prefix_and_default' ? [config.defaultLocale] : []
}

function resolveDefaultLocales(config: SetupLocalizeRoutesOptions, strategy: Strategies) {
  // under the `*_default` strategies the unprefixed locale differs per domain, `___default`
  // variants + runtime surgery resolve it - a build time default would claim the same path
  if ((config.differentDomains || config.multiDomainLocales) && usesDefaultVariants(strategy)) {
    return []
  }

  let defaultLocales = [config.defaultLocale ?? '']
  if (config.differentDomains) {
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
  locales: NormalizedLocaleObject[]
  routesNameSeparator: string
  defaultLocaleRouteNameSuffix: string
  defaultLocale?: string
  optionsResolver?: RouteOptionsResolver
  compactRoutes?: boolean
  localeAgnosticDefaultRoutes?: boolean
  onLocalize?: RouteContext['onLocalize']
}

/**
 * Localize routes
 */
export function localizeRoutes(routes: LocalizableRoute[], config: SetupLocalizeRoutesOptions): LocalizableRoute[] {
  if (!shouldLocalizeRoutes(config)) { return routes }

  const strategy = config.strategy ?? 'prefix_and_default'

  const ctx = createRouteContext({
    optionsResolver: config.optionsResolver,
    trailingSlash: config.trailingSlash ?? false,
    defaultLocales: resolveDefaultLocales(config, strategy),
    routesNameSeparator: config.routesNameSeparator,
    defaultLocaleRouteNameSuffix: config.defaultLocaleRouteNameSuffix,
    localeAgnosticDefaultRoutes: config.localeAgnosticDefaultRoutes,
    onLocalize: config.onLocalize,
  })

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
        // Unprefixed route for default locale (name: about___en, or about___default under
        // `localeAgnosticDefaultRoutes`)
        const agnostic = !!config.localeAgnosticDefaultRoutes
        const unprefixed: LocalizableRoute = { ...route }
        unprefixed.name &&= ctx.localizeRouteName(unprefixed, defaultLocale, agnostic)
        // Localize children for the default locale so they get matching suffixes
        unprefixed.children &&= ctx.localizeChildren(route, unprefixed, defaultLocale, {
          ...params,
          defaultTree: agnostic,
        })
        result.push(unprefixed)
        // Regex route for the prefixed locales (keeps base name). Under
        // `localeAgnosticDefaultRoutes` the build's default is prefixable too, since the unprefixed
        // route belongs to whichever locale the deployment defaults to.
        const prefixed = agnostic
          ? routeOptions.locales
          : routeOptions.locales.filter(l => !ctx.isDefaultLocale(l))
        if (prefixed.length > 0) {
          result.push(makeRegexRoute(prefixed))
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

  const defaultTreeLocales = new Set(resolveDefaultTreeLocales(config, strategy))
  if (defaultTreeLocales.size) {
    // unshift to preserve test snapshots
    ctx.localizers.unshift({
      enabled: ({ locale, options }) =>
        defaultTreeLocales.has(locale) && !options.defaultTree && options.parent == null,
      localizer: ({ route, ctx, locale, options }) =>
        localizeSingleRoute(route, { ...options, locales: [locale], defaultTree: true }, ctx),
    })
  }

  const locales = config.locales.map(x => x.code)
  const params: LocalizeRouteParams = { locales, defaultTree: false, shouldPrefix: createShouldPrefix(config, ctx) }
  return routes.flatMap(route => localizeSingleRoute(route, params, ctx))
}

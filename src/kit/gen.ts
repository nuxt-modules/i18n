import { toArray } from '../utils'

const join = (...args: (string | undefined)[]) => args.filter(Boolean).join('')

/**
 * Options used during route localization in {@link localizeRoutes}
 */
export interface ComputedRouteOptions {
  locales: readonly string[]
  paths: Record<string, string>
}

/**
 * Generic route object
 */
export type LocalizableRoute = {
  name?: string
  path: string
  children?: LocalizableRoute[]
  alias?: string | string[]
  redirect?: string | LocalizableRoute
  file?: string
  [key: string]: unknown
}

/**
 * Resolver for route localization options
 */
export type RouteOptionsResolver = (route: LocalizableRoute, localeCodes: string[]) => ComputedRouteOptions | undefined

export type LocalizeRouteParams = {
  shouldPrefix: (path: string, locale: string, options: LocalizeRouteParams) => boolean
  /** locales to use for localization */
  locales: string[]
  /** indicates whether this is a default route for 'prefix_and_default' strategy */
  defaultTree: boolean
  /** parent route */
  parent?: LocalizableRoute
  /** localized parent route */
  parentLocalized?: LocalizableRoute
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

function createHandleTrailingSlash(ctx: RouteContext): RouteContext['handleTrailingSlash'] {
  return (localizedPath: string, hasParent: boolean) => {
    if (!localizedPath) return ''
    const isChildWithRelativePath = hasParent && !localizedPath.startsWith('/')
    return localizedPath.replace(/\/+$/, '') + (ctx.trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
  }
}

function createLocalizeAliases(ctx: RouteContext): RouteContext['localizeAliases'] {
  return (route: LocalizableRoute, locale: string, options: LocalizeRouteParams) => {
    const aliases = toArray(route.alias).filter(Boolean) as string[]
    return aliases.map(x => {
      const alias = ctx.handleTrailingSlash(x, !!options.parent)
      const shouldPrefix = options.shouldPrefix(x, locale, options)
      return shouldPrefix ? join('/', locale, alias) : alias
    })
  }
}

function createLocalizeChildren(ctx: RouteContext): RouteContext['localizeChildren'] {
  return (route: LocalizableRoute, parentLocalized: LocalizableRoute, locale: string, opts: LocalizeRouteParams) => {
    const localizeParams = { ...opts, parent: route, locales: [locale], parentLocalized }
    return route.children?.flatMap(child => localizeSingleRoute(child, localizeParams, ctx)) ?? []
  }
}

function getLocalizedRoute(
  route: LocalizableRoute,
  locale: string,
  localizedPath: string,
  options: LocalizeRouteParams,
  ctx: RouteContext
) {
  const path = handlePathNesting(localizedPath, options.parentLocalized?.path)
  const localized: LocalizableRoute = { ...route }
  localized.path = ctx.handleTrailingSlash(path, !!options.parent)
  localized.name &&= ctx.localizeRouteName(localized, locale, options.defaultTree)
  localized.alias &&= ctx.localizeAliases(localized, locale, options)
  localized.children &&= ctx.localizeChildren(route, localized, locale, options)
  return localized
}

export function localizeSingleRoute(
  route: LocalizableRoute,
  options: LocalizeRouteParams,
  ctx: RouteContext
): LocalizableRoute[] {
  // resolve custom route (config/page) options
  const routeOptions = ctx.optionsResolver(route, options.locales)
  if (!routeOptions) {
    return [route]
  }

  const resultRoutes: LocalizableRoute[] = []
  for (const locale of routeOptions.locales) {
    // use custom path if found
    const unprefixed = routeOptions.paths?.[locale] ?? route.path

    const prefixed = join('/', locale, unprefixed)
    const usePrefix = options.shouldPrefix(unprefixed, locale, options)

    const data = { route, prefixed, unprefixed, locale, usePrefix, ctx, options }
    for (const localizer of ctx.localizers) {
      if (!localizer.enabled(data)) continue
      resultRoutes.push(...localizer.localizer(data))
    }
  }

  return resultRoutes
}

type LocalizerData = {
  route: LocalizableRoute
  prefixed: string
  unprefixed: string
  locale: string
  usePrefix: boolean
  ctx: RouteContext
  options: LocalizeRouteParams
}

export type RouteContext = {
  trailingSlash: boolean
  optionsResolver: RouteOptionsResolver
  isDefaultLocale: (locale: string) => boolean
  localizeAliases: (route: LocalizableRoute, locale: string, options: LocalizeRouteParams) => string[]
  localizeChildren: (
    route: LocalizableRoute,
    parentLocalized: LocalizableRoute,
    locale: string,
    opts: LocalizeRouteParams
  ) => LocalizableRoute[]
  localizeRouteName: (name: LocalizableRoute, locale: string, isDefault: boolean) => string
  handleTrailingSlash: (localizedPath: string, hasParent: boolean) => string
  localizers: { enabled: (data: LocalizerData) => boolean; localizer: LocalizerFn }[]
}

type LocalizerFn = (data: LocalizerData) => LocalizableRoute[]

function createDefaultOptionsResolver(opts: { optionsResolver?: RouteOptionsResolver }): RouteOptionsResolver {
  return (route, locales) => {
    // unable to resolve options
    if (route.redirect && !route.file) return undefined
    // continue with default options if unset
    if (opts?.optionsResolver == null) return { locales, paths: {} }
    return opts.optionsResolver(route, locales)
  }
}

function createLocalizeRouteName(opts: {
  routesNameSeparator?: string
  defaultLocaleRouteNameSuffix?: string
}): RouteContext['localizeRouteName'] {
  const separator = opts.routesNameSeparator || '___'
  const defaultSuffix = opts.defaultLocaleRouteNameSuffix || 'default'
  return (route, locale, isDefault) => {
    // prettier-ignore
    return !isDefault
      ? route.name + separator + locale
      : route.name + separator + locale + separator + defaultSuffix
  }
}

/**
 * Create a route context for localizing routes, includes default localizer
 */
export function createRouteContext(opts: {
  trailingSlash: boolean
  defaultLocales: string[]
  optionsResolver?: RouteOptionsResolver
  routesNameSeparator?: string
  defaultLocaleRouteNameSuffix?: string
}) {
  const ctx = { localizers: [] as RouteContext['localizers'] } as RouteContext
  ctx.trailingSlash = opts.trailingSlash ?? false
  ctx.isDefaultLocale = (locale: string) => opts.defaultLocales.includes(locale)
  ctx.localizeRouteName = createLocalizeRouteName(opts)
  ctx.optionsResolver = createDefaultOptionsResolver(opts)
  ctx.localizeAliases = createLocalizeAliases(ctx)
  ctx.localizeChildren = createLocalizeChildren(ctx)
  ctx.handleTrailingSlash = createHandleTrailingSlash(ctx)

  /**
   * Default localizer
   */
  ctx.localizers.push({
    enabled: () => true,
    localizer: ({ prefixed, unprefixed, route, usePrefix, ctx, locale, options }) => [
      getLocalizedRoute(route, locale, usePrefix ? prefixed : unprefixed, options, ctx)
    ]
  })

  return ctx
}

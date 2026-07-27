import { joinURL, parsePath, withLeadingSlash } from 'ufo'
import { createRouterMatcher } from 'vue-router'
import { disabledPaths, i18nPathToPath, localizedPaths, pathToI18nConfig } from '#build/i18n-route-resources.mjs'
import { createTrailingSlashFormatter, prefixable } from '#i18n-kit/routing'

import type { Strategies } from '#internal-i18n-types'
import type { RouteResources } from '../../routing'

export type PathMatcherConfig = {
  strategy: Strategies
  /** Whether routes are localized (pages enabled and strategy is not `no_prefix`) */
  routing: boolean
  trailingSlash: boolean
}

const emptyRoute = { path: '/', name: '', matched: [], params: {}, meta: {} }

/**
 * Resolves request paths against the routes the build generated, so path shapes are matched
 * rather than recomputed. Takes the resources and flags as values, the runtime instance below
 * composes it from the generated ones.
 */
export function createPathMatcher(resources: RouteResources, config: PathMatcherConfig) {
  const matcher = createRouterMatcher([], {})
  for (const path of [...resources.localizedPaths, ...Object.keys(resources.i18nPathToPath)]) {
    matcher.addRoute({ path, component: () => '', meta: {} })
  }

  const disabledI18nMatcher = createRouterMatcher([], {})
  for (const path of resources.disabledPaths) {
    disabledI18nMatcher.addRoute({ path, component: () => '', meta: {} })
  }

  const formatTrailingSlash = createTrailingSlashFormatter(config.trailingSlash)

  const getI18nPathToI18nPath = (path: string, locale: string) => {
    if (!path || !locale) { return }
    const plainPath = resources.i18nPathToPath[path] ?? path
    const i18nConfig = resources.pathToI18nConfig[plainPath]
    // locales without an entry use the plain path
    if (i18nConfig == null || !(locale in i18nConfig)) { return plainPath }
    return i18nConfig[locale] || undefined
  }

  function isExistingNuxtRoute(path: string) {
    if (path === '') { return }
    // TODO: path should not have base url - check if base url is stripped earlier
    // skip nuxt error route - this path is hardcoded within nitro context code in nuxt
    if (path.endsWith('/__nuxt_error')) { return }

    // skip disabled i18n routes - this prevent a redirect if there is a catch all route
    if (disabledI18nMatcher.resolve({ path }, emptyRoute).matched.length > 0) {
      return
    }

    const resolvedMatch = matcher.resolve({ path }, emptyRoute)

    return resolvedMatch.matched.length > 0 ? resolvedMatch : undefined
  }

  /**
   * Match a localized path against the resolved path and return the new path if it differs.
   * The passed path can be localized or not but should not include any prefix.
   */
  function matchLocalized(path: string, locale: string, defaultLocale: string): string | undefined {
    if (path === '') { return }
    const parsed = parsePath(path)
    const resolvedMatch = matcher.resolve({ path: parsed.pathname || '/' }, emptyRoute)
    if (resolvedMatch.matched.length === 0) { return }

    const alternate = getI18nPathToI18nPath(resolvedMatch.matched[0]!.path, locale)
    // the path is disabled for this locale, matching `/` instead would send the request
    // to the home page of whichever locale or domain it was being resolved for
    if (!alternate) { return }

    const match = matcher.resolve({ params: resolvedMatch.params }, { ...emptyRoute, path: alternate })
    const isPrefixable = prefixable(locale, defaultLocale, config)

    return formatTrailingSlash(withLeadingSlash(joinURL(isPrefixable ? locale : '', match.path)), true)
  }

  return { isExistingNuxtRoute, matchLocalized }
}

const { isExistingNuxtRoute, matchLocalized } = createPathMatcher(
  { localizedPaths, i18nPathToPath, pathToI18nConfig, disabledPaths },
  { strategy: __I18N_STRATEGY__, routing: __I18N_ROUTING__, trailingSlash: __TRAILING_SLASH__ },
)

export { isExistingNuxtRoute, matchLocalized }

import { joinURL, parsePath, withLeadingSlash } from 'ufo'
import { createRouterMatcher } from 'vue-router'
import { disabledPaths, i18nPathToPath, localizedPaths, pathToI18nConfig } from '#build/i18n-route-resources.mjs'
import { createTrailingSlashFormatter, prefixable } from '#i18n-kit/routing'

const matcher = createRouterMatcher([], {})
for (const path of [...localizedPaths, ...Object.keys(i18nPathToPath)]) {
  matcher.addRoute({ path, component: () => '', meta: {} })
}

const disabledI18nMatcher = createRouterMatcher([], {})
for (const path of disabledPaths) {
  disabledI18nMatcher.addRoute({ path, component: () => '', meta: {} })
}

const getI18nPathToI18nPath = (path: string, locale: string) => {
  if (!path || !locale) { return }
  const plainPath = i18nPathToPath[path] ?? path
  const i18nConfig = pathToI18nConfig[plainPath]
  // locales without an entry use the plain path
  if (i18nConfig == null || !(locale in i18nConfig)) { return plainPath }
  return i18nConfig[locale] || undefined
}

export function isExistingNuxtRoute(path: string) {
  if (path === '') { return }
  // TODO: path should not have base url - check if base url is stripped earlier
  // skip nuxt error route - this path is hardcoded within nitro context code in nuxt
  if (path.endsWith('/__nuxt_error')) { return }

  // skip disabled i18n routes - this prevent a redirect if there is a catch all route
  const disabledI18nResolvedMatch = disabledI18nMatcher.resolve({ path }, { path: '/', name: '', matched: [], params: {}, meta: {} })
  if (disabledI18nResolvedMatch.matched.length > 0) {
    return
  }

  const resolvedMatch = matcher.resolve({ path }, { path: '/', name: '', matched: [], params: {}, meta: {} })

  return resolvedMatch.matched.length > 0 ? resolvedMatch : undefined
}

/**
 * Match a localized path against the resolved path and return the new path if it differs.
 * The passed path can be localized or not but should not include any prefix.
 */
export function matchLocalized(path: string, locale: string, defaultLocale: string): string | undefined {
  if (path === '') { return }
  const parsed = parsePath(path)
  const resolvedMatch = matcher.resolve(
    { path: parsed.pathname || '/' },
    { path: '/', name: '', matched: [], params: {}, meta: {} },
  )

  if (resolvedMatch.matched.length > 0) {
    const alternate = getI18nPathToI18nPath(resolvedMatch.matched[0]!.path, locale)
    const match = matcher.resolve(
      { params: resolvedMatch.params },
      { path: alternate || '/', name: '', matched: [], params: {}, meta: {} },
    )

    const isPrefixable = prefixable(locale, defaultLocale, {
      strategy: __I18N_STRATEGY__,
      routing: __I18N_ROUTING__,
    })
    return createTrailingSlashFormatter(__TRAILING_SLASH__)(withLeadingSlash(joinURL(isPrefixable ? locale : '', match.path)), true)
  }
}

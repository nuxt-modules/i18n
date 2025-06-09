import { parsePath } from 'ufo'
import { createRouterMatcher } from 'vue-router'
import { i18nPathToPath, pathToI18nConfig } from '#build/i18n-route-resources.mjs'

const matcher = createRouterMatcher([], {})

for (const path of Object.keys(i18nPathToPath)) {
  matcher.addRoute({ path, component: () => '', meta: {} })
}

export const getI18nPathToI18nPath = (path: string, locale: string) => {
  if (!path || !locale) return
  const plainPath = i18nPathToPath[path]
  const i18nConfig = pathToI18nConfig[plainPath]
  if (i18nConfig && i18nConfig[locale]) {
    return i18nConfig[locale] === true ? plainPath : i18nConfig[locale]
  }
}

/**
 * Match a localized path against the resolved path and return the new path if it differs.
 * The passed path can be localized or not but should not include any prefix.
 */
export function matchLocalized(path: string, resolved: string, defaultLocale: string): string | undefined {
  if (path === '') return
  const parsed = parsePath(path)
  const resolvedMatch = matcher.resolve(
    { path: parsed.pathname },
    { path: '/', name: '', matched: [], params: {}, meta: {} }
  )

  if (resolvedMatch && resolvedMatch.matched.length > 0) {
    const alternate = getI18nPathToI18nPath(resolvedMatch?.matched[0]?.path, resolved)
    const resolvedDest = matcher.resolve(
      { params: resolvedMatch.params },
      { path: alternate || '', name: '', matched: [], params: {}, meta: {} }
    )

    const strategizedPath =
      (prefixable(resolved, defaultLocale) ? `/${resolved}` : '') +
      (resolvedDest.path.length === 1 ? '' : resolvedDest.path)
    return strategizedPath + parsed.search
  }
}

export function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    !__DIFFERENT_DOMAINS__ &&
    __I18N_ROUTING__ &&
    // only prefix default locale with strategy prefix
    (currentLocale !== defaultLocale || __I18N_STRATEGY__ === 'prefix')
  )
}

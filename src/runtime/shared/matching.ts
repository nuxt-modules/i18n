import { joinURL, parsePath, withLeadingSlash, withTrailingSlash, withoutTrailingSlash } from 'ufo'
import { createRouterMatcher } from 'vue-router'
import { i18nPathToPath, pathToI18nConfig } from '#build/i18n-route-resources.mjs'

const formatTrailingSlash = __TRAILING_SLASH__ ? withTrailingSlash : withoutTrailingSlash
const matcher = createRouterMatcher([], {})
for (const path of Object.keys(i18nPathToPath)) {
  matcher.addRoute({ path, component: () => '', meta: {} })
}

const getI18nPathToI18nPath = (path: string, locale: string) => {
  if (!path || !locale) { return }
  const plainPath = i18nPathToPath[path]!
  const i18nConfig = pathToI18nConfig[plainPath]!
  if (i18nConfig && i18nConfig[locale]) {
    return i18nConfig[locale] === true ? plainPath : i18nConfig[locale]
  }
}

export function isExistingNuxtRoute(path: string) {
  if (path === '') { return }
  // TODO: path should not have base url - check if base url is stripped earlier
  // skip nuxt error route - this path is hardcoded within nitro context code in nuxt
  if (path.endsWith('/__nuxt_error')) { return }

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

    const isPrefixable = prefixable(locale, defaultLocale)
    return formatTrailingSlash(withLeadingSlash(joinURL(isPrefixable ? locale : '', match.path)), true)
  }
}

function prefixable(currentLocale: string, defaultLocale: string): boolean {
  return (
    !__DIFFERENT_DOMAINS__
    && __I18N_ROUTING__
    // only prefix default locale with strategy prefix
    && (currentLocale !== defaultLocale || __I18N_STRATEGY__ === 'prefix')
  )
}

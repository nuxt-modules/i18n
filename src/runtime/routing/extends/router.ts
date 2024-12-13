import { getLocalesRegex, getRouteName } from '../utils'
import { localeCodes } from '#build/i18n.options.mjs'
import { useRuntimeConfig } from '#imports'

import type { CompatRoute } from '../../types'

const localesPattern = `(${localeCodes.join('|')})`
const regexpPath = getLocalesRegex(localeCodes)

export type GetLocaleFromRouteFunction = (route: string | CompatRoute) => string

export function createLocaleFromRouteGetter() {
  const { routesNameSeparator, defaultLocaleRouteNameSuffix } = useRuntimeConfig().public.i18n
  const defaultSuffixPattern = `(?:${routesNameSeparator}${defaultLocaleRouteNameSuffix})?`
  const regexpName = new RegExp(`${routesNameSeparator}${localesPattern}${defaultSuffixPattern}$`, 'i')

  /**
   * extract locale code from route name or path
   */
  const getLocaleFromRoute: GetLocaleFromRouteFunction = route => {
    let matches: RegExpMatchArray | null = null

    if (typeof route === 'string') {
      matches = route.match(regexpPath)
      return matches?.[1] ?? ''
    }

    if (route.name) {
      // extract from route name
      matches = getRouteName(route.name).match(regexpName)
    } else if (route.path) {
      // extract from path
      matches = route.path.match(regexpPath)
    }

    return matches?.[1] ?? ''
  }

  return getLocaleFromRoute
}

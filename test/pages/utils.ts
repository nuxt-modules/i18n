import type { NuxtI18nOptions } from '../../src/types'
import type { NuxtPage } from '@nuxt/schema'

import type { MarkRequired } from 'ts-essentials'
import type { LocaleObject } from '../../src/types'
import { isString } from '@intlify/shared'

export const getNormalizedLocales = (locales: string[] | LocaleObject[] = []): LocaleObject[] =>
  locales.map(x => (isString(x) ? { code: x, language: x } : x))

export function getNuxtOptions(
  pages: Required<NuxtI18nOptions>['pages'],
  customRoutes: Required<NuxtI18nOptions>['customRoutes'] = 'config',
  defaultLocale = 'en'
): MarkRequired<
  NuxtI18nOptions,
  'strategy' | 'defaultLocaleRouteNameSuffix' | 'trailingSlash' | 'routesNameSeparator'
> {
  return {
    customRoutes,
    pages,
    defaultLocale,
    strategy: 'prefix_except_default',
    defaultLocaleRouteNameSuffix: 'default',
    trailingSlash: false,
    routesNameSeparator: '___',
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ja', language: 'ja-JP', file: 'ja.json', name: 'Japanses' },
      { code: 'fr', language: 'fr-FR', file: 'fr.json', name: 'Français' }
    ] as LocaleObject[]
  }
}

export function stripFilePropertyFromPages(pages: NuxtPage[]) {
  return pages.map(page => {
    delete page.file
    if (page.children) {
      page.children = stripFilePropertyFromPages(page.children)
    }
    return page
  })
}

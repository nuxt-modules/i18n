import type { NuxtI18nOptions } from '../../src/types'
import type { NuxtPage } from '@nuxt/schema'

import type { MarkRequired } from 'ts-essentials'
import type { LocaleObject } from '../../src/types'
import type { AnalyzedNuxtPageMeta, NuxtPageAnalyzeContext } from '../../src/pages'

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

export function createPageAnalyzeContext(srcDir: string = '/path/to/nuxt-app', pagesDir: string = 'pages') {
  return {
    stack: [],
    srcDir,
    pagesDir,
    pages: new Map<string, AnalyzedNuxtPageMeta>()
  }
}

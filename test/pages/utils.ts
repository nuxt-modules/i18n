import type { NuxtI18nOptions } from '../../src/types'
import type { I18nRoute } from 'vue-i18n-routing'
import type { NuxtHooks } from '@nuxt/schema'

type ExtractArrayType<T> = T extends (infer U)[] ? U : never
export type NuxtPage = ExtractArrayType<Parameters<NuxtHooks['pages:extend']>[0]>

export function getNuxtOptions(pages: Required<NuxtI18nOptions>['pages'], parsePages = false): NuxtI18nOptions {
  return {
    parsePages,
    pages,
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    defaultLocaleRouteNameSuffix: 'default',
    trailingSlash: false,
    routesNameSeparator: '___',
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ja', iso: 'ja-JP', file: 'ja.json', name: 'Japanses' },
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', name: 'Français' }
    ]
  }
}

export function stripFilePropertyFromPages(pages: I18nRoute[]) {
  return pages.map(page => {
    delete page.file
    if (page.children) {
      page.children = stripFilePropertyFromPages(page.children)
    }
    return page
  })
}

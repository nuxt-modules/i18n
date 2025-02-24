import type { Nuxt } from '@nuxt/schema'
import {
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
  VUE_I18N_PKG
} from '../constants'
import { addComponent, addImports } from '@nuxt/kit'
import { runtimeDir } from '../dirs'
import type { I18nNuxtContext } from '../context'

export function prepareAutoImports({ debug, resolver }: I18nNuxtContext, nuxt: Nuxt) {
  const vueI18nPath = nuxt.options.alias[VUE_I18N_PKG]
  debug('vueI18nPath for auto-import', vueI18nPath)

  addComponent({
    name: 'NuxtLinkLocale',
    filePath: resolver.resolve(runtimeDir, 'components/NuxtLinkLocale')
  })

  addComponent({
    name: 'SwitchLocalePathLink',
    filePath: resolver.resolve(runtimeDir, 'components/SwitchLocalePathLink')
  })

  addImports([
    { name: 'useI18n', from: vueI18nPath },
    ...[
      'useRouteBaseName',
      'useLocalePath',
      'useLocaleRoute',
      'useSwitchLocalePath',
      'useLocaleHead',
      'useBrowserLocale',
      'useCookieLocale',
      'useSetI18nParams',
      NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
      NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
      NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
    ].map(key => ({
      name: key,
      as: key,
      from: resolver.resolve(runtimeDir, 'composables/index')
    }))
  ])
}

import type { Nuxt } from '@nuxt/schema'
import {
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
  VUE_I18N_PKG
} from '../constants'
import { addComponent, addImports } from '@nuxt/kit'
import { resolve } from 'pathe'
import { runtimeDir } from '../dirs'
import type { I18nNuxtContext } from '../context'

export async function prepareAutoImports({ debug }: I18nNuxtContext, nuxt: Nuxt) {
  const vueI18nPath = nuxt.options.alias[VUE_I18N_PKG]
  debug('vueI18nPath for auto-import', vueI18nPath)

  await Promise.all([
    addComponent({
      name: 'NuxtLinkLocale',
      filePath: resolve(runtimeDir, 'components/NuxtLinkLocale')
    }),
    addComponent({
      name: 'SwitchLocalePathLink',
      filePath: resolve(runtimeDir, 'components/SwitchLocalePathLink')
    })
  ])

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
      from: resolve(runtimeDir, 'composables/index')
    }))
  ])
}

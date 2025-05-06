import {
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
  VUE_I18N_PKG
} from '../constants'
import { addComponent, addImports, resolveModule, useNuxt } from '@nuxt/kit'
import type { I18nNuxtContext } from '../context'

export function prepareAutoImports({ resolver, userOptions: options, runtimeDir }: I18nNuxtContext, nuxt = useNuxt()) {
  addComponent({
    name: 'NuxtLinkLocale',
    filePath: resolver.resolve(runtimeDir, 'components/NuxtLinkLocale')
  })

  addComponent({
    name: 'SwitchLocalePathLink',
    filePath: resolver.resolve(runtimeDir, 'components/SwitchLocalePathLink')
  })

  const vueI18nPath = `${VUE_I18N_PKG}/dist/vue-i18n${!nuxt.options.dev && !nuxt.options._prepare && options.bundle?.runtimeOnly ? '.runtime' : ''}.mjs`
  const composablesIndex = resolver.resolve(runtimeDir, 'composables/index')
  addImports([
    { name: 'useI18n', from: resolveModule(vueI18nPath) },
    ...[
      'useRouteBaseName',
      'useLocalePath',
      'useLocaleRoute',
      'useSwitchLocalePath',
      'useLocaleHead',
      'useBrowserLocale',
      'useCookieLocale',
      'useSetI18nParams',
      'useI18nPreloadKeys',
      NUXT_I18N_COMPOSABLE_DEFINE_ROUTE,
      NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
      NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
    ].map(key => ({ name: key, as: key, from: composablesIndex }))
  ])
}

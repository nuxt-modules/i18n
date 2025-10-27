import { DEFINE_I18N_CONFIG_FN, DEFINE_I18N_LOCALE_FN, DEFINE_I18N_ROUTE_FN } from '../constants'
import { addComponent, addImports, resolveModule } from '@nuxt/kit'
import type { I18nNuxtContext } from '../context'

export function prepareAutoImports({ resolver, runtimeDir, vueI18nRuntimeOnly }: I18nNuxtContext) {
  addComponent({
    name: 'NuxtLinkLocale',
    filePath: resolver.resolve(runtimeDir, 'components/NuxtLinkLocale'),
  })

  addComponent({
    name: 'SwitchLocalePathLink',
    filePath: resolver.resolve(runtimeDir, 'components/SwitchLocalePathLink'),
  })

  const vueI18nPath = `vue-i18n/dist/vue-i18n${vueI18nRuntimeOnly ? '.runtime' : ''}`
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
      DEFINE_I18N_ROUTE_FN,
      DEFINE_I18N_LOCALE_FN,
      DEFINE_I18N_CONFIG_FN,
    ].map(key => ({ name: key, as: key, from: composablesIndex })),
  ])
}

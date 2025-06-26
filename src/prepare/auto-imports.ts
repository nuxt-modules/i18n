import { DEFINE_I18N_CONFIG_FN, DEFINE_I18N_LOCALE_FN, DEFINE_I18N_ROUTE_FN, VUE_I18N_PKG } from '../constants'
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
      DEFINE_I18N_ROUTE_FN,
      DEFINE_I18N_LOCALE_FN,
      DEFINE_I18N_CONFIG_FN
    ].map(key => ({ name: key, as: key, from: composablesIndex }))
  ])
}

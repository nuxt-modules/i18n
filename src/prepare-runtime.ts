import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from './context'
import { VIRTUAL_NUXT_I18N_LOGGER } from './virtual-logger'
import { defu } from 'defu'
import { addPlugin, addTemplate } from '@nuxt/kit'
import { generateTemplateNuxtI18nOptions } from './template'
import { generateLoaderOptions, simplifyLocaleOptions } from './gen'
import { NUXT_I18N_TEMPLATE_OPTIONS_KEY } from './constants'

export function prepareRuntime(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { isDev: dev, isSSG, localeCodes, localeInfo, normalizedLocales, options, resolver, vueI18nConfigPaths } = ctx
  // for core plugin
  addPlugin(resolver.resolve('./runtime/plugins/i18n'))
  addPlugin(resolver.resolve('./runtime/plugins/switch-locale-path-ssr'))

  // for composables
  nuxt.options.alias['#i18n'] = resolver.resolve('./runtime/composables/index')
  nuxt.options.build.transpile.push('#i18n')
  nuxt.options.build.transpile.push(VIRTUAL_NUXT_I18N_LOGGER)

  const genTemplate = (isServer: boolean, lazy?: boolean) => {
    const nuxtI18nOptions = defu({}, options)
    // override `lazy` options
    if (lazy != null) {
      nuxtI18nOptions.lazy = lazy
    }
    return generateTemplateNuxtI18nOptions({
      ...generateLoaderOptions(nuxt, {
        vueI18nConfigPaths,
        localeInfo,
        nuxtI18nOptions,
        isServer
      }),
      localeCodes,
      normalizedLocales,
      dev,
      isSSG,
      parallelPlugin: options.parallelPlugin
    })
  }

  ctx.genTemplate = genTemplate

  nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(nuxt, defu({}, options))

  addTemplate({
    filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
    write: true,
    getContents: () => genTemplate(false)
  })
}

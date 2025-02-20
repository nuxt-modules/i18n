import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import { i18nVirtualLoggerPlugin, RESOLVED_VIRTUAL_NUXT_I18N_LOGGER, VIRTUAL_NUXT_I18N_LOGGER } from '../virtual-logger'
import { defu } from 'defu'
import { addBuildPlugin, addPlugin, addTemplate, addTypeTemplate } from '@nuxt/kit'
import { generateTemplateNuxtI18nOptions } from '../template'
import { generateI18nTypes, generateLoaderOptions, simplifyLocaleOptions } from '../gen'
import { NUXT_I18N_TEMPLATE_OPTIONS_KEY } from '../constants'

export function prepareRuntime(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { isDev: dev, isSSG, localeCodes, localeInfo, normalizedLocales, options, resolver, vueI18nConfigPaths } = ctx
  // for core plugin
  addPlugin(resolver.resolve('./runtime/plugins/i18n'))
  addPlugin(resolver.resolve('./runtime/plugins/route-resolution-enhancement'))
  addPlugin(resolver.resolve('./runtime/plugins/route-locale-detect'))
  addPlugin(resolver.resolve('./runtime/plugins/ssg-detect'))
  addPlugin(resolver.resolve('./runtime/plugins/switch-locale-path-ssr'))

  // for composables
  nuxt.options.alias['#i18n'] = resolver.resolve('./runtime/composables/index')
  nuxt.options.alias['#internal-i18n-types'] = resolver.resolve('./types')
  nuxt.options.build.transpile.push('#i18n')
  nuxt.options.build.transpile.push('#internal-i18n-types')
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
        isServer,
        normalizedLocales
      }),
      hasPages: nuxt.options.pages,
      localeCodes,
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

  nuxt.options.imports.transform ??= {}
  nuxt.options.imports.transform.include ??= []
  nuxt.options.imports.transform.include.push(new RegExp(`${RESOLVED_VIRTUAL_NUXT_I18N_LOGGER}$`))

  addBuildPlugin(i18nVirtualLoggerPlugin(options.debug))

  /**
   * `$i18n` type narrowing based on 'legacy' or 'composition'
   * `locales` type narrowing based on generated configuration
   */
  addTypeTemplate({
    filename: 'types/i18n-plugin.d.ts',
    getContents: () => generateI18nTypes(nuxt, ctx.userOptions)
  })
}

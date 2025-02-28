import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import { RESOLVED_VIRTUAL_NUXT_I18N_LOGGER, VIRTUAL_NUXT_I18N_LOGGER } from '../virtual-logger'
import { defu } from 'defu'
import { addPlugin, addTemplate, addTypeTemplate, addVitePlugin, useNitro } from '@nuxt/kit'
import { generateTemplateNuxtI18nOptions } from '../template'
import { generateI18nTypes, generateLoaderOptions, simplifyLocaleOptions } from '../gen'
import { NUXT_I18N_TEMPLATE_OPTIONS_KEY } from '../constants'

export function prepareRuntime(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { options, resolver } = ctx
  // for core plugin
  addPlugin(resolver.resolve('./runtime/plugins/i18n'))
  addPlugin(resolver.resolve('./runtime/plugins/route-locale-detect'))
  addPlugin(resolver.resolve('./runtime/plugins/ssg-detect'))
  addPlugin(resolver.resolve('./runtime/plugins/switch-locale-path-ssr'))

  // for composables
  nuxt.options.alias['#i18n'] = resolver.resolve('./runtime/composables/index')
  nuxt.options.alias['#internal-i18n-types'] = resolver.resolve('./types')
  nuxt.options.build.transpile.push('#i18n')
  nuxt.options.build.transpile.push('#internal-i18n-types')
  nuxt.options.build.transpile.push(VIRTUAL_NUXT_I18N_LOGGER)

  if (ctx.isDev && options.experimental.hmr) {
    addVitePlugin({
      name: 'i18n:options-hmr',
      configureServer(server) {
        const reloadClient = () => server.ws.send({ type: 'full-reload' })

        server.ws.on('i18n:options-complex-invalidation', () => {
          // await dev reload if type generation is enabled
          if (ctx.options.experimental.typedOptionsAndMessages) {
            useNitro().hooks.hookOnce('dev:reload', reloadClient)
            return
          }

          reloadClient()
        })
      }
    })
  }

  nuxt.options.runtimeConfig.public.i18n.locales = simplifyLocaleOptions(nuxt, defu({}, options))

  addTemplate({
    filename: NUXT_I18N_TEMPLATE_OPTIONS_KEY,
    write: true,
    getContents: () => generateTemplateNuxtI18nOptions(ctx, nuxt, generateLoaderOptions(ctx, nuxt))
  })

  nuxt.options.imports.transform ??= {}
  nuxt.options.imports.transform.include ??= []
  nuxt.options.imports.transform.include.push(new RegExp(`${RESOLVED_VIRTUAL_NUXT_I18N_LOGGER}$`))

  /**
   * `$i18n` type narrowing based on 'legacy' or 'composition'
   * `locales` type narrowing based on generated configuration
   */
  addTypeTemplate({
    filename: 'types/i18n-plugin.d.ts',
    getContents: () => generateI18nTypes(nuxt, ctx.userOptions)
  })
}

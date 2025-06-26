import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import { addPlugin, addTemplate, addTypeTemplate, addVitePlugin, useNitro } from '@nuxt/kit'
import { generateTemplateNuxtI18nOptions } from '../template'
import { generateI18nTypes, generateLoaderOptions } from '../gen'

export function prepareRuntime(ctx: I18nNuxtContext, nuxt: Nuxt) {
  const { options, resolver } = ctx
  // for core plugin
  addPlugin(resolver.resolve('./runtime/plugins/i18n'))
  if (nuxt.options.dev || nuxt.options._prepare) {
    addPlugin(resolver.resolve('./runtime/plugins/dev'))
  }
  addPlugin(resolver.resolve('./runtime/plugins/preload'))
  addPlugin(resolver.resolve('./runtime/plugins/route-locale-detect'))
  addPlugin(resolver.resolve('./runtime/plugins/ssg-detect'))
  addPlugin(resolver.resolve('./runtime/plugins/switch-locale-path-ssr'))

  // for composables
  nuxt.options.alias['#i18n'] = resolver.resolve('./runtime/composables/index')
  nuxt.options.alias['#i18n-kit'] = resolver.resolve('./runtime/kit')
  nuxt.options.alias['#internal-i18n-types'] = resolver.resolve('./types')
  nuxt.options.build.transpile.push('#i18n')
  nuxt.options.build.transpile.push('#i18n-kit')
  nuxt.options.build.transpile.push('#internal-i18n-types')

  if (nuxt.options.dev && options.hmr) {
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

  addTemplate({
    filename: 'i18n-options.mjs',
    getContents: () => generateTemplateNuxtI18nOptions(ctx, generateLoaderOptions(ctx, nuxt))
  })

  /**
   * `$i18n` type narrowing based on 'legacy' or 'composition'
   * `locales` type narrowing based on generated configuration
   */
  addTypeTemplate({
    filename: 'types/i18n-plugin.d.ts',
    getContents: () => generateI18nTypes(nuxt, ctx)
  })
}

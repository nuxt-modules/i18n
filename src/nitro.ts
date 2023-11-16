import createDebug from 'debug'
import { assign } from '@intlify/shared'
import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { addServerPlugin, addTemplate, createResolver } from '@nuxt/kit'
import { getFeatureFlags } from './bundler'

import type { NuxtI18nOptions } from './types'
import type { Nuxt } from '@nuxt/schema'

const debug = createDebug('@nuxtjs/i18n:nitro')

export async function setupNitro(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>) {
  const { resolve } = createResolver(import.meta.url)

  nuxt.hook('nitro:config', async nitroConfig => {
    if (nuxtOptions.experimental.server) {
      // inline module runtime in Nitro bundle
      nitroConfig.externals = defu(typeof nitroConfig.externals === 'object' ? nitroConfig.externals : {}, {
        inline: [resolve('./runtime')]
      })

      nitroConfig.virtual = nitroConfig.virtual || {}
      /**
       * NOTE:
       * WIP
       * On the nitro side, we can share code by using virtual modules.
       * We want to share nuxt i18n options and use the same settings in the nitro plugin.
       *
       */
      nitroConfig.virtual['#i18n/resources'] = () => `export const config = { foo: 1 }`

      // auto import `@intlify/h3` utilities for server-side
      if (nitroConfig.imports) {
        const h3Exports = await resolveModuleExportNames('@intlify/h3', { url: import.meta.url })
        const excludes = ['defineI18nMiddleware', 'detectLocaleFromAcceptLanguageHeader']
        nitroConfig.imports.presets = nitroConfig.imports.presets || []
        nitroConfig.imports.presets.push({
          from: '@intlify/h3',
          imports: h3Exports.filter(name => !excludes.includes(name))
        })
      }

      // NOTE: WIP, this
      /**
       * NOTE:
       * WIP
       * This is a test code to see if the nitro plugin can import when using `getContents` instead of the template file at `addTemplate`.
       */
      addTemplate({
        filename: 'example-file.mjs',
        getContents: data => {
          console.log('exmpale-file.mjs', data.options)
          return 'export const example = 42;\nexport const foo = "bar"'
        },
        options: {
          foo: 'bar',
          test: 1
        }
      })
    }

    if (nuxt.options.ssr) {
      // vue-i18n feature flags configuration for server-side (server api, server middleware, etc...)
      nitroConfig.replace = assign(
        nitroConfig.replace || {},
        getFeatureFlags({
          jit: nuxtOptions.compilation.jit,
          compositionOnly: nuxtOptions.bundle.compositionOnly,
          fullInstall: nuxtOptions.bundle.fullInstall,
          dropMessageCompiler: nuxtOptions.compilation.jit ? nuxtOptions.bundle.dropMessageCompiler : false
        })
      )

      // setup debug flag
      nitroConfig.replace['__DEBUG__'] = String(nuxtOptions.debug)
      debug('nitro.replace', nitroConfig.replace)
    }
  })

  // add nitro plugin
  if (nuxtOptions.experimental.server) {
    await addServerPlugin(resolve('runtime/server/plugin'))
  }
}

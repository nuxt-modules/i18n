import createDebug from 'debug'
import { assign } from '@intlify/shared'
import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { addServerPlugin, addTemplate, createResolver, resolvePath, useLogger } from '@nuxt/kit'
import { getFeatureFlags } from './bundler'
import { isExists } from './utils'
import { EXECUTABLE_EXTENSIONS, NUXT_I18N_MODULE_ID } from './constants'

import type { NuxtI18nOptions } from './types'
import type { Nuxt } from '@nuxt/schema'

const debug = createDebug('@nuxtjs/i18n:nitro')

export async function setupNitro(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>) {
  const { resolve } = createResolver(import.meta.url)
  const [enableServerIntegration, localeDetectionPath] = await resolveLocaleDetectorPath(nuxt, nuxtOptions)

  nuxt.hook('nitro:config', async nitroConfig => {
    if (enableServerIntegration) {
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
      nitroConfig.virtual['#inernal/i18n/locale_detector.mjs'] = () => `
import localeDetector from ${JSON.stringify(localeDetectionPath)}
export { localeDetector }
`

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
  if (enableServerIntegration) {
    await addServerPlugin(resolve('runtime/server/plugin'))
  }
}

async function resolveLocaleDetectorPath(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>) {
  const logger = useLogger(NUXT_I18N_MODULE_ID)
  const enableServerIntegration = nuxtOptions.experimental.localeDetector != null
  if (enableServerIntegration) {
    const localeDetectorPath = await resolvePath(nuxtOptions.experimental.localeDetector!, {
      cwd: nuxt.options.rootDir,
      extensions: EXECUTABLE_EXTENSIONS
    })
    const hasLocaleDetector = await isExists(localeDetectorPath)
    if (!hasLocaleDetector) {
      logger.warn(`localeDetector file '${localeDetectorPath}' does not exist. skip server-side integration ...`)
    }
    return [enableServerIntegration, localeDetectorPath]
  } else {
    return [enableServerIntegration, '']
  }
}

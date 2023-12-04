import createDebug from 'debug'
import { assign } from '@intlify/shared'
import { resolveModuleExportNames } from 'mlly'
import { defu } from 'defu'
import { resolve } from 'pathe'
import { addServerPlugin, createResolver, resolvePath, useLogger } from '@nuxt/kit'
import { getFeatureFlags } from './bundler'
import { isExists } from './utils'
import {
  EXECUTABLE_EXTENSIONS,
  NUXT_I18N_MODULE_ID,
  NUXT_I18N_COMPOSABLE_DEFINE_LOCALE,
  NUXT_I18N_COMPOSABLE_DEFINE_CONFIG
} from './constants'

import type { Nuxt } from '@nuxt/schema'
import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:nitro')

export async function setupNitro(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>, nuxtI18nOptionsCode: string) {
  const { resolve } = createResolver(import.meta.url)
  const [enableServerIntegration, localeDetectionPath] = await resolveLocaleDetectorPath(nuxt)

  nuxt.hook('nitro:config', async nitroConfig => {
    if (enableServerIntegration) {
      // inline module runtime in Nitro bundle
      nitroConfig.externals = defu(typeof nitroConfig.externals === 'object' ? nitroConfig.externals : {}, {
        inline: [resolve('./runtime')]
      })

      nitroConfig.virtual = nitroConfig.virtual || {}
      nitroConfig.virtual['#internal/i18n/options.mjs'] = () => nuxtI18nOptionsCode
      nitroConfig.virtual['#internal/i18n/locale.detector.mjs'] = () => `
import localeDetector from ${JSON.stringify(localeDetectionPath)}
export { localeDetector }
`

      // auto import for server-side
      if (nitroConfig.imports) {
        // `@intlify/h3` utilities
        const h3Exports = await resolveModuleExportNames('@intlify/h3', { url: import.meta.url })
        const excludes = ['defineI18nMiddleware', 'detectLocaleFromAcceptLanguageHeader']
        nitroConfig.imports.presets = nitroConfig.imports.presets || []
        nitroConfig.imports.presets.push({
          from: '@intlify/h3',
          imports: h3Exports.filter(name => !excludes.includes(name))
        })
        // `defineI18nLocale` and `defineI18nConfig`
        nitroConfig.imports.imports = nitroConfig.imports.imports || []
        nitroConfig.imports.imports.push(
          ...[NUXT_I18N_COMPOSABLE_DEFINE_LOCALE, NUXT_I18N_COMPOSABLE_DEFINE_CONFIG].map(key => ({
            name: key,
            as: key,
            from: resolve('runtime/composables/shared')
          }))
        )
      }
    }

    nitroConfig.replace = nitroConfig.replace || {}

    if (nuxt.options.ssr) {
      // vue-i18n feature flags configuration for server-side (server api, server middleware, etc...)
      nitroConfig.replace = assign(
        nitroConfig.replace,
        getFeatureFlags({
          jit: nuxtOptions.compilation.jit,
          compositionOnly: nuxtOptions.bundle.compositionOnly,
          fullInstall: nuxtOptions.bundle.fullInstall,
          dropMessageCompiler: nuxtOptions.compilation.jit ? nuxtOptions.bundle.dropMessageCompiler : false
        })
      )
    }

    // setup debug flag
    nitroConfig.replace['__DEBUG__'] = String(nuxtOptions.debug)
    debug('nitro.replace', nitroConfig.replace)
  })

  // add nitro plugin
  if (enableServerIntegration) {
    await addServerPlugin(resolve('runtime/server/plugin'))
  }
}

async function resolveLocaleDetectorPath(nuxt: Nuxt) {
  const serverI18nLayer = nuxt.options._layers.find(
    l => l.config.i18n?.experimental?.localeDetector != null && l.config.i18n?.experimental?.localeDetector !== ''
  )
  let enableServerIntegration = serverI18nLayer != null

  if (serverI18nLayer != null) {
    const pathTo = resolve(serverI18nLayer.config.rootDir, serverI18nLayer.config.i18n!.experimental!.localeDetector!)
    const localeDetectorPath = await resolvePath(pathTo!, {
      cwd: nuxt.options.rootDir,
      extensions: EXECUTABLE_EXTENSIONS
    })
    const hasLocaleDetector = await isExists(localeDetectorPath)
    if (!hasLocaleDetector) {
      const logger = useLogger(NUXT_I18N_MODULE_ID)
      logger.warn(`localeDetector file '${localeDetectorPath}' does not exist. skip server-side integration ...`)
      enableServerIntegration = false
    }
    return [enableServerIntegration, localeDetectorPath]
  } else {
    return [enableServerIntegration, '']
  }
}

import createDebug from 'debug'
import { assign } from '@intlify/shared'
import { getFeatureFlags } from './bundler'

import type { NuxtI18nOptions } from './types'
import type { Nuxt } from '@nuxt/schema'

const debug = createDebug('@nuxtjs/i18n:nitro')

export async function setupNitro(nuxt: Nuxt, nuxtOptions: Required<NuxtI18nOptions>) {
  if (nuxt.options.ssr) {
    if (!nuxt.options.nitro) {
      nuxt.options.nitro = {}
    }
    const nitroConfig = nuxt.options.nitro

    // vue-i18n feature flags configuration for server-side (server api, server middleware, etc...)
    nitroConfig.replace = assign(
      nitroConfig.replace || {},
      getFeatureFlags(nuxtOptions.compilation.jit, nuxtOptions.bundle.compositionOnly)
    )

    // setup debug flag
    nitroConfig.replace['__DEBUG__'] = String(nuxtOptions.debug)
    debug('nitro.replace', nitroConfig.replace)
  }
}

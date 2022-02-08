import createDebug from 'debug'
import { defineNuxtModule, isNuxt2, isNuxt3 } from '@nuxt/kit'
import { setupNuxtBridge } from './bridge'
import { setupNuxt3 } from './nuxt3'

import type { NuxtI18nOptions } from './types'

const debug = createDebug('@nuxtjs/i18n:module')

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: '@nuxt/i18n',
    configKey: 'i18n'
  },
  defaults: {},
  async setup(options, nuxt) {
    // TODO: implementation here
    console.log('@nuxt/i18n setup!')
    debug('options', options)

    if (isNuxt2(nuxt)) {
      await setupNuxtBridge(options, nuxt)
    } else if (isNuxt3(nuxt)) {
      await setupNuxt3(options, nuxt)
    } else {
      // TODO:
    }
  }
})

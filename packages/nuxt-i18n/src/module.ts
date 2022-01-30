import { defineNuxtModule } from '@nuxt/kit'

import type { NuxtI18nOptions } from './types'

export default defineNuxtModule<NuxtI18nOptions>({
  meta: {
    name: '@nuxt/i18n',
    configKey: 'i18n'
  },
  defaults: {},
  async setup(options, nuxt) {
    // TODO: implementation here
    console.log('@nuxt/i18n setup!')
  }
})

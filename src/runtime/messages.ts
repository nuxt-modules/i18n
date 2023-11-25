import { deepCopy } from '@intlify/shared'

import type { I18nOptions } from 'vue-i18n'
import type { VueI18nConfig } from '../types'
import type { NuxtApp } from 'nuxt/dist/app'

export async function loadVueI18nOptions(
  vueI18nConfigs: VueI18nConfig[],
  nuxt: Pick<NuxtApp, 'runWithContext'>
): Promise<I18nOptions> {
  const vueI18nOptions: I18nOptions = { messages: {} }
  for (const configFile of vueI18nConfigs) {
    const { default: resolver } = await configFile()

    const resolved = typeof resolver === 'function' ? await nuxt.runWithContext(async () => await resolver()) : resolver

    deepCopy(resolved, vueI18nOptions)
  }

  return vueI18nOptions
}

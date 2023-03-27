import { createResolver } from '@nuxt/kit'
import { Nuxt } from '@nuxt/schema'
import { NuxtI18nOptions } from '@nuxtjs/i18n'

export const useRegisterI18nModule = (nuxt: Nuxt, config: Pick<NuxtI18nOptions, 'langDir' | 'locales'>) => {
  // @ts-ignore
  nuxt.hook('i18n:registerModule', registerI18nModule => {
    if (config.langDir == null || config.locales == null) return

    registerI18nModule(config)
  })
}

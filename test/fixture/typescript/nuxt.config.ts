import { Configuration as NuxtConfiguration } from '@nuxt/types'
import { NuxtVueI18n } from '../../../types/vue';

const nuxtI18nOptions: NuxtVueI18n.Options.AllOptionsInterface {
  locales: [
    { code: 'en', iso: 'en-US', name: 'English' },
    { code: 'pl', iso: 'pl-PL', name: 'Polish' }
  ],
  defaultLocale: 'en',
  parsePages: true
}

const config: NuxtConfiguration = {
  buildModules: ['@nuxt/typescript-build'],
  modules: ['nuxt-i18n', nuxtI18nOptions],
};

export default config

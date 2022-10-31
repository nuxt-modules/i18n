import type { I18nOptions } from 'vue-i18n'
import type { NuxtApp } from 'nuxt/dist/app/index'
import ja from './locales/ja.json'

export default function (nuxt: NuxtApp) {
  console.log('load vue-i18n option', ja, nuxt)
  return {
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {},
    modifiers: {
      snakeCase: (str: string) => str.split(' ').join('-')
    }
  } as I18nOptions
}

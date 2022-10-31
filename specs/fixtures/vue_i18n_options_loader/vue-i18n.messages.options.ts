import type { I18nOptions } from 'vue-i18n'
import type { NuxtApp } from 'nuxt/dist/app/index'

export default function (nuxt: NuxtApp) {
  return {
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    modifiers: {
      snakeCase: (str: string) => str.split(' ').join('-')
    },
    messages: {
      en: {
        hello: 'Hello!'
      },
      fr: {
        hello: 'Bonjour!'
      }
    }
  } as I18nOptions
}

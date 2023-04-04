import ja from './locales/ja.json'

import type { I18nOptions } from 'vue-i18n'

export default defineI18nConfig(nuxt => {
  console.log('load vue-i18n custom config')
  return {
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      ja,
      jojo: {
        world: 'the world!'
      }
    },
    modifiers: {
      snakeCase: (str: string) => str.split(' ').join('-')
    }
  } as I18nOptions
})

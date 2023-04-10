import type { I18nOptions } from 'vue-i18n'

export default {
  legacy: false,
  locale: 'en',
  fallbackLocale: 'fr',
  modifiers: {
    snakeCase: (str: string) => str.split(' ').join('-')
  },
  messages: {
    ja: {
      bar: {
        buz: 'バズ'
      }
    }
  }
  // fallbackLocale: {
  //   en: ['ja', 'fr', 'en-US'],
  //   ja: ['en', 'fr', 'ja-JP'],
  //   fr: ['en', 'ja', 'fr-FR']
  // }
} as I18nOptions

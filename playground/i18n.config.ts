import type { I18nOptions } from 'vue-i18n'

// /** @type {import('@nuxtjs/i18n').I18nOptions} */
const config: I18nOptions = {
  legacy: false,
  locale: 'en',
  fallbackLocale: 'fr',
  modifiers: {
    // @ts-expect-error
    snakeCase: (str: string) => str.split(' ').join('-')
  },
  messages: {
    ja: {
      hello: 'こんにちは！'
    }
  }
  // fallbackLocale: {
  //   en: ['ja', 'fr', 'en-US'],
  //   ja: ['en', 'fr', 'ja-JP'],
  //   fr: ['en', 'ja', 'fr-FR']
  // }
}

export default config

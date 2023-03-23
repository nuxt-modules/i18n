// import { defineI18nConfig, type I18nOptions } from '@nuxtjs/i18n'

// export default <I18nOptions>{
export default defineI18nConfig({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'fr'
  // messages: {
  //   ja: {
  //     hello: 'こんにちは！'
  //   }
  // }
  // fallbackLocale: {
  //   en: ['ja', 'fr', 'en-US'],
  //   ja: ['en', 'fr', 'ja-JP'],
  //   fr: ['en', 'ja', 'fr-FR']
  // }
})

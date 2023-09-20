import { defineI18nConfig } from '#i18n'

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en: {},
    ja: {
      msg: '日本語のメッセージ'
    }
  }
}))

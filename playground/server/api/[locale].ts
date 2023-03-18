import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

/**
 * NOTE:
 *  locale resources is managed on backend examples
 */

const locales: LocaleMessages<DefineLocaleMessage> = {
  'en-GB': {
    settings: {
      profile: 'Profile'
    }
  },
  ja: {
    layouts: {
      title: 'ページ ー {title}'
    },
    pages: {
      title: {
        top: 'トップ',
        about: 'このサイトについて'
      }
    },
    welcome: 'ようこそ',
    hello: 'こんにちは {name} ！'
  }
}

export default defineEventHandler(event => {
  const locale = event.context.params?.locale
  if (locale == null) {
    return {}
  }
  return locales[locale] || {}
})

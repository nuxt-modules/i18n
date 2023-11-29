import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

/**
 * NOTE:
 *  locale resources is managed on backend examples
 */

const locales: LocaleMessages<DefineLocaleMessage> = {
  'en-GB': {
    id: new Date().toISOString(),
    settings: {
      profile: 'Profile'
    }
  },
  ja: {
    id: new Date().toISOString(),
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

export default defineEventHandler(async event => {
  const locale = event.context.params?.locale
  locales['en-GB'].id = new Date().toISOString()
  locales['ja'].id = new Date().toISOString()

  await new Promise(resolve => setTimeout(resolve, 5000))
  if (locale == null) {
    return {}
  }
  return locales[locale] || {}
})

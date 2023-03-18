import type { Locale } from 'vue-i18n'
import type { NuxtApp } from '@nuxt/schema'

export default function (context: NuxtApp, locale: Locale) {
  return {
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
  } as Record<string, any>
}

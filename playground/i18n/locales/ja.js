export default async function (locale) {
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
  }
}

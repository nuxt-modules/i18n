// a locale file the module cannot treat as static, which keeps the static ones in the bundler graph
export default defineI18nLocale(() => ({
  sentinel: 'size-sentinel-ja',
  nav: { home: 'ホーム', about: '概要', post: '投稿', greeting: 'こんにちは {name}' },
}))

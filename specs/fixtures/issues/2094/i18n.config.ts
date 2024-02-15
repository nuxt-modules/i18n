const config = defineI18nConfig(() => {
  return {
    legacy: false,
    locale: 'ja',
    messages: {
      ja: {
        big: 'こんにちは,'.repeat(10)
      }
    }
  }
})

export default config

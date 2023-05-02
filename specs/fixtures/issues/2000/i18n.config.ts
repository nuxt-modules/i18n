export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: 'en',
    messages: {
      ja: {
        big: 'こんにちは,'.repeat(8 * 500)
      }
    }
  }
})

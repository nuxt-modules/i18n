import fr from './locales/fr.json'

export default defineI18nConfig(nuxt => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    ja: {
      bar: {
        buz: 'こんにちは！{name}!'
      }
    },
    fr
  },
  modifiers: {
    // @ts-ignore
    snakeCase: (str: string) => str.split(' ').join('-')
  }
}))

import fr from './locales/fr.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    ja: {
      bar: {
        buz: 'こんにちは！{name}!',
        fn: ({ named }: any) => `こんにちは！${named('name')}!`
      }
    },
    fr
  },
  modifiers: {
    // @ts-ignore
    snakeCase: (str: string) => str.split(' ').join('-')
  }
}))

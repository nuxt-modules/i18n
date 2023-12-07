import fr from './locales/fr.json'

export default defineI18nConfig(() => {
  const config = useRuntimeConfig()
  return {
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      ja: {
        bar: {
          buz: 'こんにちは！{name}!',
          fn: ({ named }: any) => `こんにちは！${named('name')}!`
        },
        items: [{ name: 'りんご' }, { name: 'バナナ' }, { name: 'いちご' }]
      },
      fr
    },
    modifiers: {
      // @ts-ignore
      snakeCase: (str: string) => str.split(' ').join('-')
    },
    missingWarn: true,
    fallbackWarn: true,
    warnHtmlMessage: true,
    silentFallbackWarn: false,
    silentTranslationWarn: false
  }
})

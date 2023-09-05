export default {
  fallbackLocale: 'en',
  messages: {
    fr: {
      thanks: 'Merci!',
      about: 'Should be overridden'
    },
    nl: {
      thanks: 'Bedankt!',
      uniqueTranslation: 'Unieke vertaling'
    },
    en: {
      about: 'About this site',
      snakeCaseText: "@.snakeCase:{'about'}",
      pascalCaseText: "@.pascalCase:{'about'}"
    }
  },
  modifiers: {
    // @ts-ignore
    pascalCase: (str: string) =>
      str
        .split(' ')
        .map(s => s.slice(0, 1).toUpperCase() + s.slice(1))
        .join('')
  }
}

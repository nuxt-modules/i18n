export default {
  fallbackLocale: 'en',
  messages: {
    fr: {
      thanks: 'Merci!',
      aboutSite: 'Should be overridden'
    },
    nl: {
      thanks: 'Bedankt!'
      // uniqueTranslation: 'Unieke vertaling'
    },
    en: {
      aboutSite: 'About this site',
      snakeCaseText: "@.snakeCase:{'aboutSite'}",
      pascalCaseText: "@.pascalCase:{'aboutSite'}"
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

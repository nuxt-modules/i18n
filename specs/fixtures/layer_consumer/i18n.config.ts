export default {
  fallbackLocale: 'nl',
  messages: {
    nl: {
      about: 'Over deze site',
      snakeCaseText: "@.snakeCase:{'about'}",
      pascalCaseText: "@.pascalCase:{'about'}"
    },
    fr: {
      about: 'À propos de ce site',
      snakeCaseText: "@.snakeCase:{'about'}",
      pascalCaseText: "@.pascalCase:{'about'}"
    }
  },
  modifiers: {
    // @ts-ignore
    snakeCase: (str: string) => str.split(' ').join('-')
  }
}

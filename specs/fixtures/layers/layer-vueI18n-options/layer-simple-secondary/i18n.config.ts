export default {
  messages: {
    en: {
      about: 'Should be overridden',
      uniqueTranslation: 'Unique translation'
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

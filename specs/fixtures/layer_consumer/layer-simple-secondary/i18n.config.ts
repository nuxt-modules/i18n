export default {
  messages: {
    en: {
      about: 'Should be overridden'
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

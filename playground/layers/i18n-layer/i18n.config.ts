export default defineI18nConfig(() => {
  return {
    messages: {
      ja: {
        layerText: 'これはマージされたロケールキーです'
      }
    },
    modifiers: {
      // @ts-ignore
      pascalCase: (str: string) =>
        str
          .split(' ')
          .map(s => s.slice(0, 1).toUpperCase() + s.slice(1))
          .join('')
    },
    missingWarn: false,
    fallbackWarn: false,
    warnHtmlMessage: false,
    silentFallbackWarn: true,
    silentTranslationWarn: true
  }
})

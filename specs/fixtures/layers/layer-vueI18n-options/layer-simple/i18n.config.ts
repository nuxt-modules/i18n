import type { I18nOptions } from 'vue-i18n'

// (#2094) export using variable and typescript
const config: I18nOptions = {
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
      pascalCaseText: "@.pascalCase:{'aboutSite'}",
      variableExportedI18nConfig: 'Exporting using variable identifier works!'
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

export default config

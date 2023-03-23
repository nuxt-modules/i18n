import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

const locales: LocaleMessages<DefineLocaleMessage> = {
  'en-GB': {
    settings: {
      nest: {
        foo: {
          bar: {
            profile: 'Profile1'
          }
        }
      }
    }
  }
}

export default defineEventHandler(event => {
  const locale = event.context.params?.locale
  if (locale == null) {
    return {}
  }
  return locales[locale] || {}
})

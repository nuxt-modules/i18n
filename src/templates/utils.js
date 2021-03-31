import { localeMessages, options } from './options'
import { formatMessage } from './utils-common'

/**
 * Asynchronously load messages from translation files
 *
 * @param {import('@nuxt/types').Context} context
 * @param {string} locale Language code to load
 * @return {Promise<void>}
 */
export async function loadLanguageAsync (context, locale) {
  const { app } = context
  const { i18n } = app

  if (!i18n.loadedLanguages) {
    i18n.loadedLanguages = []
  }

  if (!i18n.loadedLanguages.includes(locale)) {
    const localeObject = options.normalizedLocales.find(l => l.code === locale)
    if (localeObject) {
      const { file } = localeObject
      if (file) {
        /* <% if (options.options.langDir) { %> */
        /** @type {import('vue-i18n').LocaleMessageObject | undefined} */
        let messages
        if (process.client) {
          const { nuxtState } = context
          if (nuxtState && nuxtState.__i18n && nuxtState.__i18n.langs[locale]) {
            messages = nuxtState.__i18n.langs[locale]
            // Even if already cached in Nuxt state, trigger locale import so that HMR kicks-in on changes to that file.
            if (context.isDev) {
              localeMessages[file]()
            }
          }
        }
        if (!messages) {
          try {
            // @ts-ignore
            const getter = await localeMessages[file]().then(m => m.default || m)
            messages = typeof getter === 'function' ? await Promise.resolve(getter(context, locale)) : getter
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(formatMessage(`Failed loading async locale export: ${error.message}`))
          }
        }
        if (messages) {
          i18n.setLocaleMessage(locale, messages)
          i18n.loadedLanguages.push(locale)
        }
        /* <% } %> */
      } else {
        console.warn(formatMessage(`Could not find lang file for locale ${locale}`))
      }
    } else {
      console.warn(formatMessage(`Attempted to load messages for non-existant locale code "${locale}"`))
    }
  }
}

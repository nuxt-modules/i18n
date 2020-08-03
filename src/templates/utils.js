import {
  LOCALE_CODE_KEY,
  LOCALE_FILE_KEY,
  MODULE_NAME,
  defaultLangFile
} from './options'
/* <% if (options.defaultLangFile) { %> */
import defaultLangModule from './default-lang/<%= options.defaultLangFile %>'
/* <% } %> */

/**
 * Asynchronously load messages from translation files
 * @param  {Context}  context  Nuxt context
 * @param  {String}   locale  Language code to load
 */
export async function loadLanguageAsync (context, locale) {
  const { app } = context

  if (!app.i18n.loadedLanguages) {
    app.i18n.loadedLanguages = []
  }

  if (!app.i18n.loadedLanguages.includes(locale)) {
    const localeObject = app.i18n.locales.find(l => l[LOCALE_CODE_KEY] === locale)
    if (localeObject) {
      const file = localeObject[LOCALE_FILE_KEY]
      if (file) {
        // Hiding template directives from eslint so that parsing doesn't break.
        /* <% if (options.langDir) { %> */
        let messages
        if (process.client) {
          const { nuxtState } = context
          if (nuxtState.__i18n && nuxtState.__i18n.langs[file]) {
            messages = nuxtState.__i18n.langs[file]
          }
        }
        if (!messages) {
          try {
            let langFileModule
            if (file === defaultLangFile) {
              langFileModule = defaultLangModule
            } else {
              langFileModule = await import(/* webpackChunkName: "lang-[request]" */ `./langs/${file}`)
            }
            const getter = langFileModule.default || langFileModule
            messages = typeof getter === 'function' ? await Promise.resolve(getter(context, locale)) : getter
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
          }
        }
        if (messages) {
          app.i18n.setLocaleMessage(locale, messages)
          app.i18n.loadedLanguages.push(locale)
        }
        /* <% } %> */
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[${MODULE_NAME}] Could not find lang file for locale ${locale}`)
      }
    }
  }
}

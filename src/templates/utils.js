/**
 * Asynchronously load messages from translation files
 * @param  {VueI18n}  i18n  vue-i18n instance
 * @param  {String}   lang  Language code to load
 * @return {Promise}
 */
export function loadLanguageAsync (i18n, locale) {
  const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
  const LOCALE_FILE_KEY = '<%= options.LOCALE_FILE_KEY %>'

  if (!i18n.loadedLanguages) {
    i18n.loadedLanguages = []
  }
  if (!i18n.loadedLanguages.includes(locale)) {
    const langOptions = i18n.locales.find(l => l[LOCALE_CODE_KEY] === locale)
    if (langOptions) {
      const file = langOptions[LOCALE_FILE_KEY];
      return import(/* webpackChunkName: "lang-[request]" */ '~/<%= options.langDir %>' + file)
        .then(messages => {
          console.log(file + ' loaded')
          i18n.setLocaleMessage(locale, messages)
          i18n.loadedLanguages.push(locale)
          return
        })
    }
  }
  return Promise.resolve()
}

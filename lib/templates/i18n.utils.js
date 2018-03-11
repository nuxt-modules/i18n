/**
 * Asynchronously load messages from translation files
 * @param  {VueI18n}  i18n  vue-i18n instance
 * @param  {String}   lang  Language code to load
 * @return {Promise}
 */
export function loadLanguageAsync (i18n, lang) {
  if (!i18n.loadedLanguages) {
    i18n.loadedLanguages = []
  }
  if (!i18n.loadedLanguages.includes(lang)) {
    const langOptions = i18n.locales.find(l => l.code === lang)
    if (langOptions) {
      const { langFile } = langOptions;
      return import(/* webpackChunkName: "lang-[request]" */ '~/<%= options.langDir %>'+langFile)
        .then(msgs => {
          i18n.setLocaleMessage(lang, msgs)
          i18n.loadedLanguages.push(lang)
          return
        })
    }
  }
  return Promise.resolve()
}

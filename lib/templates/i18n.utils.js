export function loadLanguageAsync (i18n, lang, langFiles) {
  if (!i18n.loadedLanguages) {
    i18n.loadedLanguages = []
  }
  if (!i18n.loadedLanguages.includes(lang)) {
    const langFile = langFiles[lang]
    if (langFile) {
      return import(/* webpackChunkName: "lang-[request]" */ '@/<%= options.langDir %>/'+langFile).then(msgs => {
        i18n.setLocaleMessage(lang, msgs)
        i18n.loadedLanguages.push(lang)
        return
      })
    }
  }
  return Promise.resolve()
}

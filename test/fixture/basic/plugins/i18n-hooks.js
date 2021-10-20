/** @type {import('@nuxt/types').Plugin} */
export default ({ app }) => {
  app.i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    if (!window.testData) {
      window.testData = {
        languageSwitchedListeners: []
      }
    }

    window.testData.languageSwitchedListeners.push({
      newLocale,
      oldLocale
    })
  }
}

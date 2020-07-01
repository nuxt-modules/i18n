/** @type {import('@nuxt/types').Plugin} */
export default ({ app, store }) => {
  app.i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    if (!window.testData) {
      window.testData = {
        languageSwitchedListeners: []
      }
    }

    window.testData.languageSwitchedListeners.push({
      storeLocale: store.state.i18n.locale,
      newLocale,
      oldLocale
    })
  }
}

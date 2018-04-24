import Vue from 'vue'

Vue.mixin({
  head () {
    if (this.$i18n && this.$i18n.locales && this.i18n !== false && this._hasMetaInfo) {
      const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
      const LOCALE_ISO_KEY = '<%= options.LOCALE_ISO_KEY %>'

      // Prepare html lang attribute
      const currentLocaleData = this.$i18n.locales.find(l => l[LOCALE_CODE_KEY] === this.$i18n.locale)
      const htmlAttrs = {}
      if (currentLocaleData && currentLocaleData[LOCALE_ISO_KEY]) {
        htmlAttrs.lang = currentLocaleData[LOCALE_ISO_KEY]
      }

      // hreflang tags
      const link = this.$i18n.locales
        .map(locale => {
          if (locale[LOCALE_ISO_KEY]) {
            return {
              hid: 'alternate-hreflang-' + locale[LOCALE_ISO_KEY],
              rel: 'alternate',
              href: this.switchLocalePath(locale.code),
              hreflang: locale[LOCALE_ISO_KEY]
            }
          } else {
            console.warn('[<%= options.MODULE_NAME %>] Locale ISO code is required to generate alternate link')
            return null
          }
        })
      .filter(item => !!item)

      return {
        htmlAttrs,
        link
      }
    }
    return {}
  }
})


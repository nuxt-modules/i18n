import Vue from 'vue'

Vue.mixin({
  head () {
    if (!this.$i18n || this.$i18n.ignorePaths.indexOf(this.$route.fullPath) !== -1) {
      return {}
    }

    // Prepare html lang attribute
    const currentLocaleData = this.$i18n.locales.find(l => l.code === this.$i18n.locale)
    const htmlAttrs = {}
    if (currentLocaleData && currentLocaleData.iso) {
      htmlAttrs.lang = currentLocaleData.iso
    }
    return {
      htmlAttrs,
      // Generate hreflang tags
      link: this.$i18n.locales.map(locale => ({
        hid: 'alternate-hreflang-' + locale.iso,
        rel: 'alternate',
        href: this.switchLocalePath(locale.code),
        hreflang: locale.iso
      })),
      meta: [
        // Replace dash with underscore as defined in spec: language_TERRITORY
        { hid: 'og:locale', name: 'og:locale', property: 'og:locale', content: currentLocaleData.iso.replace(/-/g, '_') },
        ...this.$i18n.locales
          .filter(l => l.iso !== currentLocaleData.iso)
          .map(locale => ({
            hid: 'og:locale:alternate-' + locale.iso,
            name: 'og:locale:alternate',
            property: 'og:locale:alternate',
            content: locale.iso.replace(/-/g, '_')
          }))
      ]
    }
  }
})

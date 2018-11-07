const LOCALE_CODE_KEY = 'code'
const LOCALE_ISO_KEY = 'iso'
const COMPONENT_OPTIONS_KEY = 'nuxtI18n'

export const nuxtI18nSeo = function () {
  if (
    !this._hasMetaInfo ||
    !this.$i18n ||
    !this.$i18n.locales ||
    this.$options[COMPONENT_OPTIONS_KEY] === false ||
    (this.$options[COMPONENT_OPTIONS_KEY] && this.$options[COMPONENT_OPTIONS_KEY].seo === false)
  ) {
    return {};
  }

  const BASE_URL = this.$i18n.nuxtI18n.baseUrl

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
          href: BASE_URL + this.switchLocalePath(locale.code),
          hreflang: locale[LOCALE_ISO_KEY]
        }
      } else {
        console.warn('[nuxt-i18n] Locale ISO code is required to generate alternate link')
        return null
      }
    })
    .filter(item => !!item)

  // og:locale meta
  const meta = []
  // og:locale - current
  if (currentLocaleData && currentLocaleData[LOCALE_ISO_KEY]) {
    meta.push({
      hid: 'og:locale',
      name: 'og:locale',
      property: 'og:locale',
      // Replace dash with underscore as defined in spec: language_TERRITORY
      content: currentLocaleData[LOCALE_ISO_KEY].replace(/-/g, '_')
    })
  }
  // og:locale - alternate
  meta.push(
    ...this.$i18n.locales
      .filter(l => l[LOCALE_ISO_KEY] && l[LOCALE_ISO_KEY] !== currentLocaleData[LOCALE_ISO_KEY])
      .map(locale => ({
        hid: 'og:locale:alternate-' + locale[LOCALE_ISO_KEY],
        name: 'og:locale:alternate',
        property: 'og:locale:alternate',
        content: locale[LOCALE_ISO_KEY].replace(/-/g, '_')
      }))
  );

  return {
    htmlAttrs,
    link,
    meta
  }
}

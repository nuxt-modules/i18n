import VueMeta from 'vue-meta'
import {
  baseUrl,
  COMPONENT_OPTIONS_KEY,
  LOCALE_CODE_KEY,
  LOCALE_ISO_KEY,
  MODULE_NAME,
  STRATEGIES,
  strategy
} from './options'

export const nuxtI18nSeo = function () {
  if (
    !(VueMeta.hasMetaInfo ? VueMeta.hasMetaInfo(this) : this._hasMetaInfo) ||
    !this.$i18n ||
    !this.$i18n.locale ||
    !this.$i18n.locales ||
    this.$options[COMPONENT_OPTIONS_KEY] === false ||
    (this.$options[COMPONENT_OPTIONS_KEY] && this.$options[COMPONENT_OPTIONS_KEY].seo === false)
  ) {
    return {}
  }
  // Prepare html lang attribute
  const currentLocaleData = this.$i18n.locales.find(l => l[LOCALE_CODE_KEY] === this.$i18n.locale)
  const htmlAttrs = {}
  if (currentLocaleData && currentLocaleData[LOCALE_ISO_KEY]) {
    htmlAttrs.lang = currentLocaleData[LOCALE_ISO_KEY]
  }

  const link = []
  // hreflang tags
  if (strategy !== STRATEGIES.NO_PREFIX) {
    link.push(...this.$i18n.locales
      .map(locale => {
        if (locale[LOCALE_ISO_KEY]) {
          return {
            hid: 'alternate-hreflang-' + locale[LOCALE_ISO_KEY],
            rel: 'alternate',
            href: baseUrl + this.switchLocalePath(locale.code),
            hreflang: locale[LOCALE_ISO_KEY]
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn(`[${MODULE_NAME}] Locale ISO code is required to generate alternate link`)
          return null
        }
      })
      .filter(item => !!item))
  }

  // canonical links
  if (strategy === STRATEGIES.PREFIX_AND_DEFAULT) {
    const canonicalPath = this.switchLocalePath(currentLocaleData[LOCALE_CODE_KEY])
    if (canonicalPath && canonicalPath !== this.$route.path) {
      // Current page is not the canonical one -- add a canonical link
      link.push({
        hid: 'canonical-lang-' + currentLocaleData[LOCALE_CODE_KEY],
        rel: 'canonical',
        href: baseUrl + canonicalPath
      })
    }
  }

  // og:locale meta
  const meta = []
  // og:locale - current
  if (currentLocaleData && currentLocaleData[LOCALE_ISO_KEY]) {
    meta.push({
      hid: 'og:locale',
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
        property: 'og:locale:alternate',
        content: locale[LOCALE_ISO_KEY].replace(/-/g, '_')
      }))
  )

  return {
    htmlAttrs,
    link,
    meta
  }
}

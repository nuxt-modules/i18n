import VueMeta from 'vue-meta'
import { Constants, options } from './options'

/**
 * @this {import('vue/types/vue').Vue}
 * @return {import('vue-meta').MetaInfo}
 */
export function nuxtI18nHead ({ addDirAttribute = true, addSeoAttributes = false } = {}) {
  // Can happen when using from a global mixin.
  if (!this.$i18n) {
    return {}
  }

  /** @type {import('vue-meta').MetaInfo} */
  const metaObject = {}
  metaObject.htmlAttrs = {}
  metaObject.link = []
  metaObject.meta = []

  const currentLocale = this.$i18n.localeProperties
  const currentLocaleIso = currentLocale[Constants.LOCALE_ISO_KEY]
  const currentLocaleDir = currentLocale[Constants.LOCALE_DIR_KEY] || options.defaultDirection

  /**
   * Adding Direction Attribute:
   */
  if (addDirAttribute) {
    metaObject.htmlAttrs.dir = currentLocaleDir
  }

  /**
   * Adding SEO Meta:
   */
  if (
    addSeoAttributes &&
    (VueMeta.hasMetaInfo ? VueMeta.hasMetaInfo(this) : this._hasMetaInfo) &&
    this.$i18n.locale &&
    this.$i18n.locales &&
    this.$options[Constants.COMPONENT_OPTIONS_KEY] !== false &&
    !(this.$options[Constants.COMPONENT_OPTIONS_KEY] && this.$options[Constants.COMPONENT_OPTIONS_KEY].seo === false)
  ) {
    if (currentLocaleIso) {
      metaObject.htmlAttrs.lang = currentLocaleIso // TODO: simple lang or "specific" lang with territory?
    }

    addHreflangLinks.bind(this)(this.$i18n.locales, this.$i18n.__baseUrl, metaObject.link)
    addCanonicalLinks.bind(this)(this.$i18n.__baseUrl, metaObject.link)
    addCurrentOgLocale.bind(this)(currentLocale, currentLocaleIso, metaObject.meta)
    addAlternateOgLocales.bind(this)(this.$i18n.locales, currentLocaleIso, metaObject.meta)
  }

  /**
   * Internals:
   */

  /**
   * @this {import('vue/types/vue').Vue}
   * @return {import('vue-meta').MetaInfo['link']}
   */
  function addHreflangLinks (locales, baseUrl, link) {
    if (options.strategy === Constants.STRATEGIES.NO_PREFIX) {
      return
    }
    const localeMap = new Map()
    for (const locale of locales) {
      const localeIso = isoFromLocale(locale)

      if (!localeIso) {
        // eslint-disable-next-line no-console
        console.warn(`[${Constants.MODULE_NAME}] Locale ISO code is required to generate alternate link`)
        continue
      }

      const [language, region] = localeIso.split('-')

      if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
        localeMap.set(language, locale)
      }

      localeMap.set(localeIso, locale)
    }

    for (const [iso, mapLocale] of localeMap.entries()) {
      link.push({
        hid: `i18n-alt-${iso}`,
        rel: 'alternate',
        href: toAbsoluteUrl(this.switchLocalePath(mapLocale.code), baseUrl),
        hreflang: iso
      })
    }

    if (options.defaultLocale) {
      link.push({
        hid: 'i18n-xd',
        rel: 'alternate',
        href: toAbsoluteUrl(this.switchLocalePath(options.defaultLocale), baseUrl),
        hreflang: 'x-default'
      })
    }
  }

  /**
   * @this {import('vue/types/vue').Vue}
   */
  function addCanonicalLinks (baseUrl, link) {
    const currentRoute = this.localeRoute({
      ...this.$route,
      name: this.getRouteBaseName()
    })

    const canonicalPath = currentRoute ? currentRoute.path : null

    if (canonicalPath) {
      link.push({
        hid: 'i18n-can',
        rel: 'canonical',
        href: toAbsoluteUrl(canonicalPath, baseUrl)
      })
    }
  }

  /**
   * @this {import('vue/types/vue').Vue}
   */
  function addCurrentOgLocale (currentLocale, currentLocaleIso, meta) {
    const hasCurrentLocaleAndIso = currentLocale && currentLocaleIso

    if (!hasCurrentLocaleAndIso) {
      return
    }

    meta.push({
      hid: 'i18n-og',
      property: 'og:locale',
      // Replace dash with underscore as defined in spec: language_TERRITORY
      content: underscoreIsoFromLocale(currentLocale)
    })
  }

  /**
   * @this {import('vue/types/vue').Vue}
   */
  function addAlternateOgLocales (locales, currentLocaleIso, meta) {
    const localesWithoutCurrent = locales.filter(locale => {
      const localeIso = isoFromLocale(locale)
      return localeIso && localeIso !== currentLocaleIso
    })

    const alternateLocales = localesWithoutCurrent.map(locale => ({
      hid: `i18n-og-alt-${isoFromLocale(locale)}`,
      property: 'og:locale:alternate',
      content: underscoreIsoFromLocale(locale)
    }))

    meta.push(...alternateLocales)
  }

  function isoFromLocale (locale) {
    return locale[Constants.LOCALE_ISO_KEY]
  }

  function underscoreIsoFromLocale (locale) {
    return isoFromLocale(locale).replace(/-/g, '_')
  }

  function toAbsoluteUrl (urlOrPath, baseUrl) {
    if (urlOrPath.match(/^https?:\/\//)) {
      return urlOrPath
    }
    return baseUrl + urlOrPath
  }

  return metaObject
}

/**
 * @deprecated
 * @this {import('vue/types/vue').Vue}
 */
export function nuxtI18nSeo () {
  return nuxtI18nHead.call(this, { addDirAttribute: false, addSeoAttributes: true })
}

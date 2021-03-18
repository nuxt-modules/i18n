import VueMeta from 'vue-meta'
import { Constants, options } from './options'

/** @typedef {Required<Pick<import('vue-meta').MetaInfo, 'htmlAttrs' | 'link' | 'meta'>>} SeoMeta */

/**
 * @this {import('vue/types/vue').Vue}
 * @return {import('vue-meta').MetaInfo}
 */
export function nuxtI18nHead ({ addDirAttribute = true, addSeoAttributes = false } = {}) {
  // Can happen when using from a global mixin.
  if (!this.$i18n) {
    return {}
  }

  /** @type {SeoMeta} */
  const metaObject = {
    htmlAttrs: {},
    link: [],
    meta: []
  }

  const currentLocale = this.$i18n.localeProperties
  const currentLocaleIso = currentLocale.iso
  const currentLocaleDir = currentLocale.dir || options.defaultDirection

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
    // @ts-ignore
    (VueMeta.hasMetaInfo ? VueMeta.hasMetaInfo(this) : this._hasMetaInfo) &&
    this.$i18n.locale &&
    this.$i18n.locales &&
    this.$options[Constants.COMPONENT_OPTIONS_KEY] !== false &&
    // @ts-ignore
    !(this.$options[Constants.COMPONENT_OPTIONS_KEY] && this.$options[Constants.COMPONENT_OPTIONS_KEY].seo === false)
  ) {
    if (currentLocaleIso) {
      metaObject.htmlAttrs.lang = currentLocaleIso // TODO: simple lang or "specific" lang with territory?
    }

    const locales = /** @type {import('../../types').LocaleObject[]} */(this.$i18n.locales)

    addHreflangLinks.bind(this)(locales, this.$i18n.__baseUrl, metaObject.link)
    addCanonicalLinks.bind(this)(this.$i18n.__baseUrl, metaObject.link)
    addCurrentOgLocale.bind(this)(currentLocale, currentLocaleIso, metaObject.meta)
    addAlternateOgLocales.bind(this)(locales, currentLocaleIso, metaObject.meta)
  }

  /**
   * Internals:
   */

  /**
   * @this {import('vue/types/vue').Vue}
   *
   * @param {import('../../types').LocaleObject[]} locales
   * @param {string} baseUrl
   * @param {SeoMeta['link']} link
   */
  function addHreflangLinks (locales, baseUrl, link) {
    if (options.strategy === Constants.STRATEGIES.NO_PREFIX) {
      return
    }
    /** @type {Map<string, import('../../types').LocaleObject>} */
    const localeMap = new Map()
    for (const locale of locales) {
      const localeIso = locale.iso

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
      const localePath = this.switchLocalePath(mapLocale.code)
      if (localePath) {
        link.push({
          hid: `i18n-alt-${iso}`,
          rel: 'alternate',
          href: toAbsoluteUrl(localePath, baseUrl),
          hreflang: iso
        })
      }
    }

    if (options.defaultLocale) {
      const localePath = this.switchLocalePath(options.defaultLocale)
      if (localePath) {
        link.push({
          hid: 'i18n-xd',
          rel: 'alternate',
          href: toAbsoluteUrl(localePath, baseUrl),
          hreflang: 'x-default'
        })
      }
    }
  }

  /**
   * @this {import('vue/types/vue').Vue}
   *
   * @param {string} baseUrl
   * @param {SeoMeta['link']} link
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
   *
   * @param {import('../../types').LocaleObject} currentLocale
   * @param {string | undefined} currentLocaleIso
   * @param {SeoMeta['meta']} meta
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
      content: hypenToUnderscore(currentLocaleIso)
    })
  }

  /**
   * @this {import('vue/types/vue').Vue}
   *
   * @param {import('../../types').LocaleObject[]} locales
   * @param {string | undefined} currentLocaleIso
   * @param {SeoMeta['meta']} meta
   */
  function addAlternateOgLocales (locales, currentLocaleIso, meta) {
    const localesWithoutCurrent = locales.filter(locale => {
      const localeIso = locale.iso
      return localeIso && localeIso !== currentLocaleIso
    })

    if (localesWithoutCurrent.length) {
      const alternateLocales = localesWithoutCurrent.map(locale => ({
        hid: `i18n-og-alt-${locale.iso}`,
        property: 'og:locale:alternate',
        content: hypenToUnderscore(locale.iso)
      }))

      meta.push(...alternateLocales)
    }
  }

  /**
   * @param {string | undefined} str
   * @return {string}
   */
  function hypenToUnderscore (str) {
    return (str || '').replace(/-/g, '_')
  }

  /**
   * @param {string} urlOrPath
   * @param {string} baseUrl
   */
  function toAbsoluteUrl (urlOrPath, baseUrl) {
    if (urlOrPath.match(/^https?:\/\//)) {
      return urlOrPath
    }
    return baseUrl + urlOrPath
  }

  return metaObject
}

/**
 * @deprecated Use `nuxtI18nHead()` instead.
 * @this {import('vue/types/vue').Vue}
 */
export function nuxtI18nSeo () {
  return nuxtI18nHead.call(this, { addDirAttribute: false, addSeoAttributes: true })
}

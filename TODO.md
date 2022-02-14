# TODO

This todo is based on [nuxt/i18n](https://i18n.nuxtjs.org/) docs.

## Guide

- [ ] Callbacks
  - [ ] onBeforeLanguageSwitch
  - [ ] onLanguageSwitched
- [x] Routing
- [x] Strategies
  - [x] no_prefix
  - [x] prefix_except_default
  - [x] prefix
  - [x] prefix_and_default
  - [x] Configurations
- [ ] Custom route paths
  - [ ] In-component options
  - [ ] Module's configuration
- [ ] Ignoring localized routes
  - [ ] Pick localized routes
  - [ ] Disable localized routes
- [ ] Browser language detection
- [ ] SEO
  - [x] Requirements
  - [ ] Setup
  - [x] Feature details
- [ ] Lazy-load translations
- [ ] Lang Switcher
  - [ ] Dynamic route parameters
  - [ ] Wait for page transition
- [ ] Different domains
- [x] Locale fallback
- [ ] Per-component translations
- [ ] Extending messages hook

## API Reference

### Extension of Vue (Composable)

- [x] localePath
- [x] switchLocalePath
- [x] getRouteBaseName
- [x] localeRoute
- [x] localeLocation
- [x] ~~$nuxtI18nHead~~ -> useI18nHead

### Extension of VueI18n (Composer)

- [ ] getLocaleCookie
- [ ] setLocaleCookie
- [ ] ~~setLocale~~ -> deprecated (locale setter)
- [ ] getBrowserLocale
- [ ] finalizePendingLocaleChange
- [ ] waitForPendingLocaleChange
- [ ] defaultDirection
- [x] defaultLocale
- [x] localeCodes
- [x] locales
- [ ] localeProperties
- [ ] differentDomains
- [ ] onBeforeLanguageSwitch
- [ ] onLanguageSwitched

### Extension of Nuxt Context

- [x] i18n
- [ ] getRouteBaseName
- [ ] localePath
- [ ] localeRoute
- [ ] localeLocation
- [ ] switchLocalePath

### Extension of Vuex

- [ ] $i18n
- [ ] getRouteBaseName
- [ ] localePath
- [ ] localeRoute
- [ ] localeLocation
- [ ] switchLocalePath

### Extension of Pinia?

TBD

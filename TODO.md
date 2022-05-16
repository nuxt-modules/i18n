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
  - [x] Module's configuration
- [ ] Ignoring localized routes
  - [ ] Pick localized routes
  - [ ] Disable localized routes
- [x] Browser language detection
- [ ] SEO
  - [x] Requirements
  - [ ] Setup
  - [x] Feature details
- [-] Lazy-load translations (`skipNuxtState` is not supported yet)
- [ ] Lang Switcher
  - [ ] Dynamic route parameters
  - [ ] Wait for page transition
- [ ] Different domains
- [x] Locale fallback
- [ ] Per-component translations
- [ ] Extending messages hook

## API Reference

### Extension of Vue

- [x] localePath
- [x] switchLocalePath
- [x] getRouteBaseName
- [x] localeRoute
- [x] localeLocation
- [x] localeHead (nuxt 3 only)
- [x] $nuxtI18nHead (nuxt bridge only)

### Extension of VueI18n / Composer

- [x] getLocaleCookie
- [x] setLocaleCookie
- [-] setLocale
- [x] getBrowserLocale
- [ ] finalizePendingLocaleChange
- [ ] waitForPendingLocaleChange
- [ ] defaultDirection
- [x] defaultLocale
- [x] localeCodes
- [x] locales
- [x] localeProperties
- [ ] differentDomains
- [ ] onBeforeLanguageSwitch
- [ ] onLanguageSwitched

### Extension of Nuxt Context

- [x] i18n
- [x] getRouteBaseName
- [x] localePath
- [x] localeRoute
- [x] localeLocation
- [x] switchLocalePath

### Composition APIs (NEW!)

- [x] useLocalePath (same `localePath`)
- [x] useSwitchLocalePath (same `switchLocalePath`)
- [x] useRouteBaseName (same `getRouteBaseName`)
- [x] useLocaleRoute (same `localeRoute`)
- [x] useLocaleLocation (same `localeLocation`)
- [x] useLocaleHead (same `$nuxtI18nHead` )
- [-] useBrowserLocale (same `getBrowserLocale`, TODO: should be renamed)

### Extension of Vuex

- [ ] $i18n
- [ ] getRouteBaseName
- [ ] localePath
- [ ] localeRoute
- [ ] localeLocation
- [ ] switchLocalePath

### Extension of Pinia?

TBD

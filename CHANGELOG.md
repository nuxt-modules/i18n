# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.2"></a>
## [1.0.2](https://github.com/paulgv/nuxt-i18n/compare/v1.0.1...v1.0.2) (2017-12-07)

### Fixed
- 2nd fix for children routes generation ([b53059e](https://github.com/paulgv/nuxt-i18n/commit/b53059e)) @MengWeiChen

<a name="1.0.1"></a>
# [1.0.1](https://github.com/paulgv/nuxt-i18n/compare/v1.0.0...v1.0.1) (2017-12-05)

### Fixed
- Fix children routes generator ([696b7c7](https://github.com/paulgv/nuxt-i18n/commit/696b7c7)) @MengWeiChen



<a name="1.0.0"></a>
# [1.0.0](https://github.com/paulgv/nuxt-i18n/compare/v0.1.0...v1.0.0) (2017-12-05)


### Features

* **refactor:** refactor module's code ([e4186dc](https://github.com/paulgv/nuxt-i18n/commit/e4186dc))


### BREAKING CHANGES

* **refactor:** Route generation utils have been renamed & the module doesn't register a vuex module anymore

- Replace all calls to getLocalizedRoute() with localePath()
- Replace all calls to getSwitchLocaleRoute() with switchLocalePath()
- Configured locales are now accessible in any component via `$i18n.locales`
- Similarly, default app locale can be accessed via `i18n.defaultLocale`

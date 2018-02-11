# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.2.4"></a>
## [2.2.4](https://github.com/paulgv/nuxt-i18n/compare/v2.2.3...v2.2.4) (2018-02-11)


### Bug Fixes

* Use same Regex for matching URL locale in plugin and middleware ([a590e93](https://github.com/paulgv/nuxt-i18n/commit/a590e93)), closes [#17](https://github.com/paulgv/nuxt-i18n/issues/17)



<a name="2.2.3"></a>
## [2.2.3](https://github.com/paulgv/nuxt-i18n/compare/v2.2.2...v2.2.3) (2018-02-11)



<a name="2.2.2"></a>
## [2.2.2](https://github.com/paulgv/nuxt-i18n/compare/v2.2.1...v2.2.2) (2018-02-10)



<a name="2.2.1"></a>
## [2.2.1](https://github.com/paulgv/nuxt-i18n/compare/v2.2.0...v2.2.1) (2018-02-10)


### Bug Fixes

* Cleaner URLs for index ([72938f3](https://github.com/paulgv/nuxt-i18n/commit/72938f3))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/paulgv/nuxt-i18n/compare/v2.1.1...v2.2.0) (2018-02-10)


### Features

* Generate pages SEO metadata ([dfb8432](https://github.com/paulgv/nuxt-i18n/commit/dfb8432))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/paulgv/nuxt-i18n/compare/v2.1.0...v2.1.1) (2018-02-08)


### Bug Fixes

* Fix for URLs with hashes ([#13](https://github.com/paulgv/nuxt-i18n/issues/13)) ([2e0649a](https://github.com/paulgv/nuxt-i18n/commit/2e0649a)), closes [#12](https://github.com/paulgv/nuxt-i18n/issues/12)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/paulgv/nuxt-i18n/compare/v2.0.1...v2.1.0) (2018-01-27)


### Features

* Add noPrefixDefaultLocale option ([dac14ae](https://github.com/paulgv/nuxt-i18n/commit/dac14ae))
* Add redirectRootToLocale option ([65cacfd](https://github.com/paulgv/nuxt-i18n/commit/65cacfd))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/paulgv/nuxt-i18n/compare/v2.0.0...v2.0.1) (2018-01-27)



<a name="2.0.0"></a>
# [2.0.0](https://github.com/paulgv/nuxt-i18n/compare/v1.1.0...v2.0.0) (2018-01-26)


### Features

* Improved dynamic nested routes support ([e08935e](https://github.com/paulgv/nuxt-i18n/commit/e08935e))

### BREAKING CHANGES

* Custom routes translations now use routes `chunkName` instead of `name`, you should update your config accordlingly.

<a name="1.1.0"></a>
# [1.1.0](https://github.com/paulgv/nuxt-i18n/compare/v1.0.2...v1.1.0) (2018-01-22)


### Features

* Add ignorePaths option ([1a0fc57](https://github.com/paulgv/nuxt-i18n/commit/1a0fc57))



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

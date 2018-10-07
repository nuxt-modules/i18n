# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="5.4.0"></a>
# [5.4.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.3.0...v5.4.0) (2018-10-07)


### Features

* add TypeScript types ([#133](https://github.com/nuxt-community/nuxt-i18n/issues/133)) ([817c58e](https://github.com/nuxt-community/nuxt-i18n/commit/817c58e))
* i18n.locale property changes when route changed ([2f2f284](https://github.com/nuxt-community/nuxt-i18n/commit/2f2f284))



<a name="5.3.0"></a>
# [5.3.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.2.1...v5.3.0) (2018-09-11)


### Features

* Support vue-loader >=15.0.0 ([#125](https://github.com/nuxt-community/nuxt-i18n/issues/125)) ([3d5b9d2](https://github.com/nuxt-community/nuxt-i18n/commit/3d5b9d2))



<a name="5.2.1"></a>
## [5.2.1](https://github.com/nuxt-community/nuxt-i18n/compare/v5.2.0...v5.2.1) (2018-08-26)



<a name="5.2.0"></a>
## [5.2.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.1.1...v5.2.0) (2018-08-24)

### Features

* Ability to define locale domains at runtime via Vuex store ([0226b07](https://github.com/nuxt-community/nuxt-i18n/commit/0226b07))

<a name="5.1.1"></a>
## [5.1.1](https://github.com/nuxt-community/nuxt-i18n/compare/v5.1.0...v5.1.1) (2018-08-14)



<a name="5.1.0"></a>
# [5.1.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.0.3...v5.1.0) (2018-08-11)


### Features

* Add option to automatically add vue-i18n-loader to Webpack config ([d997b81](https://github.com/nuxt-community/nuxt-i18n/commit/d997b81)), closes [#58](https://github.com/nuxt-community/nuxt-i18n/issues/58)



<a name="5.0.3"></a>
## [5.0.3](https://github.com/nuxt-community/nuxt-i18n/compare/v5.0.2...v5.0.3) (2018-08-10)


### Bug Fixes

* **middleware:** Return after root redirect ([c2ce741](https://github.com/nuxt-community/nuxt-i18n/commit/c2ce741)), closes [#104](https://github.com/nuxt-community/nuxt-i18n/issues/104)



<a name="5.0.2"></a>
## [5.0.2](https://github.com/nuxt-community/nuxt-i18n/compare/v5.0.1...v5.0.2) (2018-08-09)


### Bug Fixes

* Fix `TypeError: Cannot read property 'pages' of undefined` in `extendRoutes` ([10ba9ed](https://github.com/nuxt-community/nuxt-i18n/commit/10ba9ed)), closes [#113](https://github.com/nuxt-community/nuxt-i18n/issues/113)



<a name="5.0.1"></a>
## [5.0.1](https://github.com/nuxt-community/nuxt-i18n/compare/v5.0.0...v5.0.1) (2018-08-09)


### Bug Fixes

* Prevent error when using `extendRoutes` ([1509a71](https://github.com/nuxt-community/nuxt-i18n/commit/1509a71)), closes [#52](https://github.com/nuxt-community/nuxt-i18n/issues/52)



<a name="5.0.0"></a>
# [5.0.0](https://github.com/nuxt-community/nuxt-i18n/compare/v4.1.0...v5.0.0) (2018-08-08)


### Bug Fixes

* making hreflang href full-qualified ([5dd4231](https://github.com/nuxt-community/nuxt-i18n/commit/5dd4231))


### Chores

* Upgrade vue-i18n to v8.0.0 ([6b1a982](https://github.com/nuxt-community/nuxt-i18n/commit/6b1a982))


### Features

* **strategy:** add PREFIX_AND_DEFAULT strategy ([a7ea4df](https://github.com/nuxt-community/nuxt-i18n/commit/a7ea4df))


### BREAKING CHANGES

* [https://github.com/kazupon/vue-i18n/blob/dev/CHANGELOG.md#800-2018-06-23](https://github.com/kazupon/vue-i18n/blob/dev/CHANGELOG.md#800-2018-06-23)



<a name="4.1.0"></a>
# [4.1.0](https://github.com/nuxt-community/nuxt-i18n/compare/v4.0.2...v4.1.0) (2018-06-27)


### Features

* **browser language detection:** Add support for mode SPA ([12bbef6](https://github.com/nuxt-community/nuxt-i18n/commit/12bbef6)), closes [#103](https://github.com/nuxt-community/nuxt-i18n/issues/103)



<a name="4.0.2"></a>
## [4.0.2](https://github.com/nuxt-community/nuxt-i18n/compare/v4.0.1...v4.0.2) (2018-06-27)


### Bug Fixes

* support locales with names that match other locales (`en` and `en-us`) ([eeda1c5](https://github.com/nuxt-community/nuxt-i18n/commit/eeda1c5))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/nuxt-community/nuxt-i18n/compare/v4.0.0...v4.0.1) (2018-06-22)


### Bug Fixes

* No name on parent routes ([#101](https://github.com/nuxt-community/nuxt-i18n/issues/101)) ([fd51e3e](https://github.com/nuxt-community/nuxt-i18n/commit/fd51e3e)), closes [#98](https://github.com/nuxt-community/nuxt-i18n/issues/98)



<a name="4.0.0"></a>
# [4.0.0](https://github.com/nuxt-community/nuxt-i18n/compare/v3.3.1...v4.0.0) (2018-06-07)


### Bug Fixes

* Rename in-component options key from i18n to nuxtI18n ([5ff618d](https://github.com/nuxt-community/nuxt-i18n/commit/5ff618d)), closes [#94](https://github.com/nuxt-community/nuxt-i18n/issues/94) [#67](https://github.com/nuxt-community/nuxt-i18n/issues/67)


### BREAKING CHANGES

* Pages using i18n key need to be updated to use nuxtI18n key instead



<a name="3.3.1"></a>
## [3.3.1](https://github.com/nuxt-community/nuxt-i18n/compare/v3.3.0...v3.3.1) (2018-06-06)


### Bug Fixes

* Fix routes generation with nuxt generate ([#95](https://github.com/nuxt-community/nuxt-i18n/issues/95)) ([ff127a5](https://github.com/nuxt-community/nuxt-i18n/commit/ff127a5)), closes [#82](https://github.com/nuxt-community/nuxt-i18n/issues/82)



<a name="3.3.0"></a>
# [3.3.0](https://github.com/nuxt-community/nuxt-i18n/compare/v3.2.4...v3.3.0) (2018-05-30)


### Features

* **loadLanguageAsync:** Support promises return in lang files. ([9b220c3](https://github.com/nuxt-community/nuxt-i18n/commit/9b220c3))
* Add support for X-Forwarded-Host ([#92](https://github.com/nuxt-community/nuxt-i18n/issues/92)) ([514ad63](https://github.com/nuxt-community/nuxt-i18n/commit/514ad63))



<a name="3.2.4"></a>
## [3.2.4](https://github.com/nuxt-community/nuxt-i18n/compare/v3.2.3...v3.2.4) (2018-05-27)



<a name="3.2.3"></a>
## [3.2.3](https://github.com/nuxt-community/nuxt-i18n/compare/v3.2.2...v3.2.3) (2018-05-10)


### Bug Fixes

* Fix 'logger is not defined' error ([b79b570](https://github.com/nuxt-community/nuxt-i18n/commit/b79b570))



<a name="3.2.2"></a>
## [3.2.2](https://github.com/nuxt-community/nuxt-i18n/compare/v3.2.1...v3.2.2) (2018-05-10)


### Bug Fixes

* Fix an issue where the module would attempt to generate og:locale tags without required ISO code ([5dd97d5](https://github.com/nuxt-community/nuxt-i18n/commit/5dd97d5)), closes [#80](https://github.com/nuxt-community/nuxt-i18n/issues/80)



<a name="3.2.1"></a>
## [3.2.1](https://github.com/nuxt-community/nuxt-i18n/compare/v3.2.0...v3.2.1) (2018-05-10)


### Bug Fixes

* Lock esm to 3.0.28 to prevent error at build time ([e909837](https://github.com/nuxt-community/nuxt-i18n/commit/e909837)), closes [#85](https://github.com/nuxt-community/nuxt-i18n/issues/85)



<a name="3.2.0"></a>
# [3.2.0](https://github.com/nuxt-community/nuxt-i18n/compare/v3.1.0...v3.2.0) (2018-05-09)


### Features

* Add parsePages & pages options ([b2980cf](https://github.com/nuxt-community/nuxt-i18n/commit/b2980cf))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/nuxt-community/nuxt-i18n/compare/v3.0.0...v3.1.0) (2018-05-01)


### Features

* Add og:locale support & fix i18n.seo component option ([8c1588e](https://github.com/nuxt-community/nuxt-i18n/commit/8c1588e))

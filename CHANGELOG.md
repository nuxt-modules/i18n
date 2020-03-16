### [6.6.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.6.0...v6.6.1) (2020-03-16)


### Bug Fixes

* **types:** add vueI18nLoader to AllOptionsInterface ([#634](https://github.com/nuxt-community/nuxt-i18n/issues/634)) ([f1dd816](https://github.com/nuxt-community/nuxt-i18n/commit/f1dd81676803033a210d28e3bc406a54b4c86c0c))
* add tests for forwardedHost change, deprecate setting instead of removing ([3f4d135](https://github.com/nuxt-community/nuxt-i18n/commit/3f4d13577bbca02e3b8d4bdd156a7854a95c7f0d))
* Incomplete initialization with 'en-US' locale code and no default ([#629](https://github.com/nuxt-community/nuxt-i18n/issues/629)) ([eeb63bb](https://github.com/nuxt-community/nuxt-i18n/commit/eeb63bb701d1b76804790e87ef8cabe9149fdb9a)), closes [#628](https://github.com/nuxt-community/nuxt-i18n/issues/628)
* remove forwardedHost option - make domain matching consistent on server/client ([#630](https://github.com/nuxt-community/nuxt-i18n/issues/630)) ([2a17c99](https://github.com/nuxt-community/nuxt-i18n/commit/2a17c99145c280b7304691396b8e009056054ae5))

## [6.6.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.5.0...v6.6.0) (2020-02-27)


### Features

* Added cookieDomain option to override locale cookie's domain ([#599](https://github.com/nuxt-community/nuxt-i18n/issues/599)) ([7525cd7](https://github.com/nuxt-community/nuxt-i18n/commit/7525cd712fde658befdae948f75db5b95a914bf2))
* **seo:** additional catchall hreflang tags ([#597](https://github.com/nuxt-community/nuxt-i18n/issues/597)) ([ebd2213](https://github.com/nuxt-community/nuxt-i18n/commit/ebd22137901255fffd8468464d87ac0afa43c8aa)), closes [#522](https://github.com/nuxt-community/nuxt-i18n/issues/522)
* support external configuration file for vue-i18n options ([#605](https://github.com/nuxt-community/nuxt-i18n/issues/605)) ([c55bc6a](https://github.com/nuxt-community/nuxt-i18n/commit/c55bc6a5f2cae0b2bf323f7de1e02da9e1d278d2)), closes [#585](https://github.com/nuxt-community/nuxt-i18n/issues/585) [#237](https://github.com/nuxt-community/nuxt-i18n/issues/237)


### Bug Fixes

* sync store locale before triggering onLanguageSwitched listener ([#609](https://github.com/nuxt-community/nuxt-i18n/issues/609)) ([9b699cf](https://github.com/nuxt-community/nuxt-i18n/commit/9b699cf61eb0515fe9a3479e04abce810650ed25)), closes [#556](https://github.com/nuxt-community/nuxt-i18n/issues/556)

## [6.5.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.4.1...v6.5.0) (2020-01-20)


### Features

* support paths in localePath() ([#554](https://github.com/nuxt-community/nuxt-i18n/issues/554)) ([29a282e](https://github.com/nuxt-community/nuxt-i18n/commit/29a282ebf47a6dab9de3520abae5393de6f4c721))

### [6.4.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.4.0...v6.4.1) (2019-12-02)


### Bug Fixes

* **routing:** Restore handling of route argument in getRouteBaseName ([3685abb](https://github.com/nuxt-community/nuxt-i18n/commit/3685abba66edfb5e5b3720db8ba99d2af4127f13)), closes [#539](https://github.com/nuxt-community/nuxt-i18n/issues/539)

## [6.4.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.3.1...v6.4.0) (2019-11-18)


### Features

* **parser:** parse typescript 3.7 shipped proposals ([a69a8fb](https://github.com/nuxt-community/nuxt-i18n/commit/a69a8fb4ba478a022e363b2f1b7990588360f07f))

### [6.3.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.3.0...v6.3.1) (2019-11-11)


### Bug Fixes

* default locale catch-all route overrides locale-specific one ([196bf9c](https://github.com/nuxt-community/nuxt-i18n/commit/196bf9cb58f157a72d49a7598df77e536f272093)), closes [#152](https://github.com/nuxt-community/nuxt-i18n/issues/152)
* Direct navigation to URL in SPA with vue-router in hash mode ([0a9c4c8](https://github.com/nuxt-community/nuxt-i18n/commit/0a9c4c8b4cffc81f5c1c5f9906f545edd1d5cd9a)), closes [#490](https://github.com/nuxt-community/nuxt-i18n/issues/490)
* make switchLocalePath work from Nuxt plugin or middleware ([8a1c052](https://github.com/nuxt-community/nuxt-i18n/commit/8a1c052f340ad8f86d62fb1e3c6f1107360fb0e9)), closes [#480](https://github.com/nuxt-community/nuxt-i18n/issues/480)
* set sameSite=Lax option for detected-language cookie ([8d84986](https://github.com/nuxt-community/nuxt-i18n/commit/8d8498619023296957ae56fea4ca6996b357aa6a)), closes [#516](https://github.com/nuxt-community/nuxt-i18n/issues/516)

## [6.3.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.2.1...v6.3.0) (2019-09-26)


### Bug Fixes

* **types:** add missing seo: false type for component options ([0fae937](https://github.com/nuxt-community/nuxt-i18n/commit/0fae937))
* all routes removed when locales are absent ([1c5e42c](https://github.com/nuxt-community/nuxt-i18n/commit/1c5e42c)), closes [#444](https://github.com/nuxt-community/nuxt-i18n/issues/444)
* **types:** specify arguments for onLanguageSwitched and beforeLanguageSwitch ([da6a523](https://github.com/nuxt-community/nuxt-i18n/commit/da6a523))
* Don't inject to store if store is not defined ([e547639](https://github.com/nuxt-community/nuxt-i18n/commit/e547639))
* Locale prefixes missing for child routes with custom paths ([10c1d9d](https://github.com/nuxt-community/nuxt-i18n/commit/10c1d9d)), closes [#359](https://github.com/nuxt-community/nuxt-i18n/issues/359)
* NO_PREFIX - localePath with `path` returns route with prefix ([4d4186c](https://github.com/nuxt-community/nuxt-i18n/commit/4d4186c)), closes [#457](https://github.com/nuxt-community/nuxt-i18n/issues/457)
* Route name missing for routes that have children ([bd23683](https://github.com/nuxt-community/nuxt-i18n/commit/bd23683)), closes [#356](https://github.com/nuxt-community/nuxt-i18n/issues/356)


### Features

* Inject $i18n into Vuex Store as `this.$i18n` ([bb31cb0](https://github.com/nuxt-community/nuxt-i18n/commit/bb31cb0))

### [6.2.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.2.0...v6.2.1) (2019-09-13)


### Bug Fixes

* **types:** use correct module name for nuxt augmentation ([46f67ea](https://github.com/nuxt-community/nuxt-i18n/commit/46f67ea))

## [6.2.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.1.3...v6.2.0) (2019-09-13)


### Bug Fixes

* crash on no_prefix + invalid/tempered locale cookie ([4b56d84](https://github.com/nuxt-community/nuxt-i18n/commit/4b56d84))
* Don't try to process routes with no component ([a53e32a](https://github.com/nuxt-community/nuxt-i18n/commit/a53e32a))
* failure to change locale on initial try with nuxt generate ([9b4b6f6](https://github.com/nuxt-community/nuxt-i18n/commit/9b4b6f6)), closes [#378](https://github.com/nuxt-community/nuxt-i18n/issues/378)


### Features

* support 'path' parameter in localePath(...) ([bbaa266](https://github.com/nuxt-community/nuxt-i18n/commit/bbaa266)), closes [#215](https://github.com/nuxt-community/nuxt-i18n/issues/215)

### [6.1.3](https://github.com/nuxt-community/nuxt-i18n/compare/v6.1.2...v6.1.3) (2019-09-04)


### Bug Fixes

* make `parsePages` compatible with typescript decorators ([5a3db3b](https://github.com/nuxt-community/nuxt-i18n/commit/5a3db3b)), closes [#408](https://github.com/nuxt-community/nuxt-i18n/issues/408) [#76](https://github.com/nuxt-community/nuxt-i18n/issues/76)

### [6.1.2](https://github.com/nuxt-community/nuxt-i18n/compare/v6.1.1...v6.1.2) (2019-09-04)


### Bug Fixes

* issue with locale not being updated when cookie not stored ([999ac4b](https://github.com/nuxt-community/nuxt-i18n/commit/999ac4b))
* multiple redirects on switching to another locale ([14ceeb3](https://github.com/nuxt-community/nuxt-i18n/commit/14ceeb3))
* **types:** add type for Nuxt's `context.app.i18n` ([d5afd8b](https://github.com/nuxt-community/nuxt-i18n/commit/d5afd8b))
* **types:** add types for in-component options ([e2e3bca](https://github.com/nuxt-community/nuxt-i18n/commit/e2e3bca))
* **types:** export `NuxtVueI18n` namespace to allow to annotate configuration ([906a776](https://github.com/nuxt-community/nuxt-i18n/commit/906a776))
* **types:** fixed various types for NuxtI18n configuration ([6f6c235](https://github.com/nuxt-community/nuxt-i18n/commit/6f6c235))
* **types:** move getLocaleCookie/setLocaleCookie/SetLocale to proper interface ([7d3eceb](https://github.com/nuxt-community/nuxt-i18n/commit/7d3eceb))
* **types:** remove `null` result from `getLocaleCookie` to simplify types ([df5ac8a](https://github.com/nuxt-community/nuxt-i18n/commit/df5ac8a))
* **types:** update NuxtI18nSeo interface to use VueMeta types ([3a4ada6](https://github.com/nuxt-community/nuxt-i18n/commit/3a4ada6))

### Notes

* `app.$t` API was removed ([ca198e5](https://github.com/nuxt-community/nuxt-i18n/commit/ca198e5)) - This is not a breaking change since this API has never worked according to my understanding.
* `getLocaleCookie` will no longer return `null` value in case cookie is missing. Instead it will consistently return `undefined`. This is unlikely to affect anyone unless one was checking for `null` specifically which would not be a correct thing to do even before.

### [6.1.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.1.0...v6.1.1) (2019-08-28)


### Bug Fixes

* fix loading fallback locale with lazy loading ([d8db5b1](https://github.com/nuxt-community/nuxt-i18n/commit/d8db5b1))
* locale not set with differentDomains enabled ([634690a](https://github.com/nuxt-community/nuxt-i18n/commit/634690a))
* redirects to wrong route after SPA navigation ([8bf61d9](https://github.com/nuxt-community/nuxt-i18n/commit/8bf61d9))

## [6.1.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.0.2...v6.1.0) (2019-08-27)


### Features

* Add `no_prefix` strategy + `setLocale` API function ([#409](https://github.com/nuxt-community/nuxt-i18n/issues/409)) ([998011e](https://github.com/nuxt-community/nuxt-i18n/commit/998011e))

### [6.0.2](https://github.com/nuxt-community/nuxt-i18n/compare/v6.0.1...v6.0.2) (2019-08-20)


### Bug Fixes

* warning in nuxt 2.9.x / vue-meta 2.x ([3605632](https://github.com/nuxt-community/nuxt-i18n/commit/3605632))

## [6.0.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.0.0...v6.0.1) (2019-08-13)


### Bug Fixes

* **deps:** update all non-major dependencies ([#375](https://github.com/nuxt-community/nuxt-i18n/issues/375)) ([9efbbf0](https://github.com/nuxt-community/nuxt-i18n/commit/9efbbf0))
* **deps:** update dependency acorn to v7 ([#392](https://github.com/nuxt-community/nuxt-i18n/issues/392)) ([9fc564f](https://github.com/nuxt-community/nuxt-i18n/commit/9fc564f))
* **deps:** update dependency acorn-walk to v7 ([#393](https://github.com/nuxt-community/nuxt-i18n/issues/393)) ([06ddf3e](https://github.com/nuxt-community/nuxt-i18n/commit/06ddf3e))



# [6.0.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.8...v6.0.0) (2019-07-20)


### Bug Fixes

* **routing:** resolve localePath with fullPath instead of href ([b827681](https://github.com/nuxt-community/nuxt-i18n/commit/b827681))
* Disable seo by default ([741ae12](https://github.com/nuxt-community/nuxt-i18n/commit/741ae12)), closes [#346](https://github.com/nuxt-community/nuxt-i18n/issues/346)
* update link to SEO metadata generation logic ([#352](https://github.com/nuxt-community/nuxt-i18n/issues/352)) ([10a5ff2](https://github.com/nuxt-community/nuxt-i18n/commit/10a5ff2))


### Code Refactoring

* Disable setLocale & setMessages mutations by default ([76c9978](https://github.com/nuxt-community/nuxt-i18n/commit/76c9978))
* Rename and flatten vuex options ([8897ac6](https://github.com/nuxt-community/nuxt-i18n/commit/8897ac6))


### Features

* Dynamic route parameters translation ([#345](https://github.com/nuxt-community/nuxt-i18n/issues/345)) ([2d1d729](https://github.com/nuxt-community/nuxt-i18n/commit/2d1d729)), closes [#79](https://github.com/nuxt-community/nuxt-i18n/issues/79)
* Use default locale's custom path if not defined for a locale ([#354](https://github.com/nuxt-community/nuxt-i18n/issues/354)) ([d30e5f0](https://github.com/nuxt-community/nuxt-i18n/commit/d30e5f0))


### Performance Improvements

* Register global mixins from plugins ([2ceb8e4](https://github.com/nuxt-community/nuxt-i18n/commit/2ceb8e4))


### BREAKING CHANGES

[5.x to 6.x migration path](https://nuxt-community.github.io/nuxt-i18n/migrating.html#upgrading-from-5-x-to-6-x)

* Store module's options have been flattened and renamed
* The mutations responsible for syncing nuxt-i18n's store module with vue-i18n's
locale and messages are now disabled by default, you'll need to manually re-enable them in the
module's configuration
* `preserveState` is now set automatically when registering the store module and
cannot be set via the configuration anymore
* Global seo option is now disabled by default. To
preserve the previous behaviour, set `seo: true` in the module's
options.
Doc: https://nuxt-community.github.io/nuxt-i18n/seo.html



# [6.0.0-0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.8...v6.0.0-0) (2019-07-01)


### Features

* Dynamic route parameters translation ([04373ef](https://github.com/nuxt-community/nuxt-i18n/commit/04373ef)), closes [#79](https://github.com/nuxt-community/nuxt-i18n/issues/79)


### BREAKING CHANGES

* `preserveState` is now set automatically when registering the store module and
cannot be set via the configuration anymore



## [5.12.8](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.6...v5.12.8) (2019-07-01)

> NOTE: Version bump only, all fixes were released in `v5.12.7` already

### Bug Fixes

* Move SEO types out of Vue module declaration ([be085d5](https://github.com/nuxt-community/nuxt-i18n/commit/be085d5))
* Move SEO types out of Vue module declaration ([#335](https://github.com/nuxt-community/nuxt-i18n/issues/335)) ([0cc0ba0](https://github.com/nuxt-community/nuxt-i18n/commit/0cc0ba0))
* Only require is-https dependency on the server (fixes [#329](https://github.com/nuxt-community/nuxt-i18n/issues/329)) ([8a728ef](https://github.com/nuxt-community/nuxt-i18n/commit/8a728ef))
* revert using cookies package to fix cookie headers handling ([#332](https://github.com/nuxt-community/nuxt-i18n/issues/332)) ([9cd034d](https://github.com/nuxt-community/nuxt-i18n/commit/9cd034d)), closes [#330](https://github.com/nuxt-community/nuxt-i18n/issues/330)



## [5.12.7](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.6...v5.12.7) (2019-06-22)


### Bug Fixes

* Move SEO types out of Vue module declaration ([#335](https://github.com/nuxt-community/nuxt-i18n/issues/335)) ([0cc0ba0](https://github.com/nuxt-community/nuxt-i18n/commit/0cc0ba0))
* Only require is-https dependency on the server (fixes [#329](https://github.com/nuxt-community/nuxt-i18n/issues/329)) ([8a728ef](https://github.com/nuxt-community/nuxt-i18n/commit/8a728ef))
* Revert using cookies package to fix cookie headers handling ([#332](https://github.com/nuxt-community/nuxt-i18n/issues/332)) ([9cd034d](https://github.com/nuxt-community/nuxt-i18n/commit/9cd034d)), closes [#330](https://github.com/nuxt-community/nuxt-i18n/issues/330)



## [5.12.6](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.5...v5.12.6) (2019-06-21)


### Bug Fixes

* do not discard already present set-cookie header ([#327](https://github.com/nuxt-community/nuxt-i18n/issues/327)) ([ec08be8](https://github.com/nuxt-community/nuxt-i18n/commit/ec08be8))



## [5.12.5](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.4...v5.12.5) (2019-06-20)


### Bug Fixes

* better server side protocol detection (fixes [#123](https://github.com/nuxt-community/nuxt-i18n/issues/123)) ([8cb3eb6](https://github.com/nuxt-community/nuxt-i18n/commit/8cb3eb6))



## [5.12.4](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.3...v5.12.4) (2019-06-02)


### Bug Fixes

* **deps:** update dependency cookie to ^0.4.0 ([4223f6a](https://github.com/nuxt-community/nuxt-i18n/commit/4223f6a))
* add types for nuxtI18nSeo ([5811bbe](https://github.com/nuxt-community/nuxt-i18n/commit/5811bbe))
* Unexpected token when using dynamic imports ([#320](https://github.com/nuxt-community/nuxt-i18n/issues/320)) ([7dd1dbc](https://github.com/nuxt-community/nuxt-i18n/commit/7dd1dbc)), closes [#134](https://github.com/nuxt-community/nuxt-i18n/issues/134) [#301](https://github.com/nuxt-community/nuxt-i18n/issues/301)



## [5.12.3](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.2...v5.12.3) (2019-05-13)


### Bug Fixes

* remove explicit dependency on vue-template-compiler (fixes [#297](https://github.com/nuxt-community/nuxt-i18n/issues/297)) ([576382e](https://github.com/nuxt-community/nuxt-i18n/commit/576382e))
* remove explicit dependency on vue-template-compiler (fixes [#297](https://github.com/nuxt-community/nuxt-i18n/issues/297)) ([#305](https://github.com/nuxt-community/nuxt-i18n/issues/305)) ([2eff158](https://github.com/nuxt-community/nuxt-i18n/commit/2eff158))



## [5.12.2](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.1...v5.12.2) (2019-05-09)


### Bug Fixes

* add missing vue-template-compiler dependency (fixes [#297](https://github.com/nuxt-community/nuxt-i18n/issues/297)) ([#298](https://github.com/nuxt-community/nuxt-i18n/issues/298)) ([196b4e0](https://github.com/nuxt-community/nuxt-i18n/commit/196b4e0))



## [5.12.1](https://github.com/nuxt-community/nuxt-i18n/compare/v5.12.0...v5.12.1) (2019-05-09)


### Bug Fixes

* Fix duplicate child routes with PREFIX_AND_DEFAULT strategy (fixes [#292](https://github.com/nuxt-community/nuxt-i18n/issues/292)) ([#294](https://github.com/nuxt-community/nuxt-i18n/issues/294)) ([76d5948](https://github.com/nuxt-community/nuxt-i18n/commit/76d5948))
* Fix exception when using multiple domains option (fixes [#293](https://github.com/nuxt-community/nuxt-i18n/issues/293)) ([#295](https://github.com/nuxt-community/nuxt-i18n/issues/295)) ([17f1e07](https://github.com/nuxt-community/nuxt-i18n/commit/17f1e07))



# [5.12.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.11.0...v5.12.0) (2019-05-06)


### Features

* Load fallback locale when needed if lazy-loading is enabled ([#291](https://github.com/nuxt-community/nuxt-i18n/issues/291)) ([0148546](https://github.com/nuxt-community/nuxt-i18n/commit/0148546)), closes [#34](https://github.com/nuxt-community/nuxt-i18n/issues/34)



# [5.11.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.10.0...v5.11.0) (2019-05-05)


### Features

* add global options ([fe6d114](https://github.com/nuxt-community/nuxt-i18n/commit/fe6d114))
* Always redirect to language that was saved in cookie ([#283](https://github.com/nuxt-community/nuxt-i18n/issues/283)) ([dc66895](https://github.com/nuxt-community/nuxt-i18n/commit/dc66895))



# [5.10.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.9.0...v5.10.0) (2019-04-27)


### Bug Fixes

* Prevent redirect failure when accessing a dynamic route with detectBrowserLanguage enabled ([#266](https://github.com/nuxt-community/nuxt-i18n/issues/266)) ([b7adba0](https://github.com/nuxt-community/nuxt-i18n/commit/b7adba0))


### Features

* Upgrade vue-i18n to v8.11.1 ([29f7f54](https://github.com/nuxt-community/nuxt-i18n/commit/29f7f54)), closes [/github.com/kazupon/vue-i18n/blob/dev/CHANGELOG.md#8111-2019-04-26](https://github.com//github.com/kazupon/vue-i18n/blob/dev/CHANGELOG.md/issues/8111-2019-04-26)



# [5.9.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.8.5...v5.9.0) (2019-04-25)


### Features

* pass nuxt context to loadLanguageAsync ([3834899](https://github.com/nuxt-community/nuxt-i18n/commit/3834899))



## [5.8.5](https://github.com/nuxt-community/nuxt-i18n/compare/v5.8.4...v5.8.5) (2019-03-01)


### Bug Fixes

* Prevent error "Cannot read property 'iso' of undefined" on 404 pages ([#233](https://github.com/nuxt-community/nuxt-i18n/issues/233)) ([6cb2fa1](https://github.com/nuxt-community/nuxt-i18n/commit/6cb2fa1))



<a name="5.8.4"></a>
## [5.8.4](https://github.com/nuxt-community/nuxt-i18n/compare/v5.8.3...v5.8.4) (2019-02-22)


### Bug Fixes

* Prevent duplicated route names issue with prefix_and_default strategy ([318850c](https://github.com/nuxt-community/nuxt-i18n/commit/318850c)), closes [#140](https://github.com/nuxt-community/nuxt-i18n/issues/140)



<a name="5.8.3"></a>
## [5.8.3](https://github.com/nuxt-community/nuxt-i18n/compare/v5.8.2...v5.8.3) (2019-02-17)


### Bug Fixes

* Remove extraneous name from og:locale ([#225](https://github.com/nuxt-community/nuxt-i18n/issues/225)) ([9460d27](https://github.com/nuxt-community/nuxt-i18n/commit/9460d27)), closes [#224](https://github.com/nuxt-community/nuxt-i18n/issues/224)



<a name="5.8.2"></a>
## [5.8.2](https://github.com/nuxt-community/nuxt-i18n/compare/v5.8.1...v5.8.2) (2019-02-15)


### Bug Fixes

* Set new locale into vuex store module when switching languages ([#222](https://github.com/nuxt-community/nuxt-i18n/issues/222)) ([77cc393](https://github.com/nuxt-community/nuxt-i18n/commit/77cc393)), closes [#221](https://github.com/nuxt-community/nuxt-i18n/issues/221)



<a name="5.8.1"></a>
## [5.8.1](https://github.com/nuxt-community/nuxt-i18n/compare/v5.8.0...v5.8.1) (2019-02-10)


### Bug Fixes

* Update types ([#212](https://github.com/nuxt-community/nuxt-i18n/issues/212)) ([5f8f4d7](https://github.com/nuxt-community/nuxt-i18n/commit/5f8f4d7))



<a name="5.8.0"></a>
# [5.8.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.7.0...v5.8.0) (2019-01-27)


### Bug Fixes

* Rename option encodeURI to encodePaths ([776c2dd](https://github.com/nuxt-community/nuxt-i18n/commit/776c2dd))


### Features

* Add encodeURI option to allow skipping encodeURI for custom paths ([#199](https://github.com/nuxt-community/nuxt-i18n/issues/199)) ([00c89f1](https://github.com/nuxt-community/nuxt-i18n/commit/00c89f1)), closes [#191](https://github.com/nuxt-community/nuxt-i18n/issues/191)



<a name="5.7.0"></a>
# [5.7.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.6.0...v5.7.0) (2019-01-23)


### Bug Fixes

* Fix broken condition in middleware & prevent cookie from being set twice ([#164](https://github.com/nuxt-community/nuxt-i18n/issues/164)) ([7c83922](https://github.com/nuxt-community/nuxt-i18n/commit/7c83922))


### Features

* Upgrade vue-i18n (v8.2.1 -> v8.7.0) ([feac945](https://github.com/nuxt-community/nuxt-i18n/commit/feac945))



<a name="5.6.0"></a>
# [5.6.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.5.0...v5.6.0) (2019-01-20)


### Bug Fixes

* Create correct baseroute for switchlocalepath ([#193](https://github.com/nuxt-community/nuxt-i18n/issues/193)) ([909062f](https://github.com/nuxt-community/nuxt-i18n/commit/909062f))
* Preserve route params in base route ([13b2e73](https://github.com/nuxt-community/nuxt-i18n/commit/13b2e73))


### Features

* Add canonical link to PREFIX_AND_DEFAULT duplicated pages ([#194](https://github.com/nuxt-community/nuxt-i18n/issues/194)) ([dcd1f79](https://github.com/nuxt-community/nuxt-i18n/commit/dcd1f79))



<a name="5.5.0"></a>
# [5.5.0](https://github.com/nuxt-community/nuxt-i18n/compare/v5.4.4...v5.5.0) (2019-01-14)


### Bug Fixes

* preserve queryString when redirecting to rootRedirect ([#169](https://github.com/nuxt-community/nuxt-i18n/issues/169)) ([1ddcac2](https://github.com/nuxt-community/nuxt-i18n/commit/1ddcac2))
* Set i18n_redirect cookie path to '/' ([#143](https://github.com/nuxt-community/nuxt-i18n/issues/143)) ([9ad540e](https://github.com/nuxt-community/nuxt-i18n/commit/9ad540e))
* State not defined ([#178](https://github.com/nuxt-community/nuxt-i18n/issues/178)) ([142dcb0](https://github.com/nuxt-community/nuxt-i18n/commit/142dcb0)), closes [#173](https://github.com/nuxt-community/nuxt-i18n/issues/173)
* Update types ([#167](https://github.com/nuxt-community/nuxt-i18n/issues/167)) ([225e700](https://github.com/nuxt-community/nuxt-i18n/commit/225e700))
* Wait for lazy loading promises ([#163](https://github.com/nuxt-community/nuxt-i18n/issues/163)) ([8b42631](https://github.com/nuxt-community/nuxt-i18n/commit/8b42631))


### Features

* Allow i18n component to load json ([#174](https://github.com/nuxt-community/nuxt-i18n/issues/174)) ([21d4305](https://github.com/nuxt-community/nuxt-i18n/commit/21d4305))
* expose head SEO function to use in layout ([#154](https://github.com/nuxt-community/nuxt-i18n/issues/154)) ([ce373c4](https://github.com/nuxt-community/nuxt-i18n/commit/ce373c4))
* make t() method available server-side through app.$t() ([#168](https://github.com/nuxt-community/nuxt-i18n/issues/168)) ([90bcd80](https://github.com/nuxt-community/nuxt-i18n/commit/90bcd80))
* rework browser detection and save lang to cookie ([#148](https://github.com/nuxt-community/nuxt-i18n/issues/148)) ([d1bbc84](https://github.com/nuxt-community/nuxt-i18n/commit/d1bbc84))



<a name="5.4.4"></a>
## [5.4.4](https://github.com/nuxt-community/nuxt-i18n/compare/v5.4.3...v5.4.4) (2018-10-23)


### Bug Fixes

* encode custom paths ([#145](https://github.com/nuxt-community/nuxt-i18n/issues/145)) ([98c9945](https://github.com/nuxt-community/nuxt-i18n/commit/98c9945)), closes [#7](https://github.com/nuxt-community/nuxt-i18n/issues/7)



<a name="5.4.3"></a>
## [5.4.3](https://github.com/nuxt-community/nuxt-i18n/compare/v5.4.2...v5.4.3) (2018-10-12)


### Bug Fixes

* Fix acorn-walk dependency ([#138](https://github.com/nuxt-community/nuxt-i18n/issues/138)) ([19c9f96](https://github.com/nuxt-community/nuxt-i18n/commit/19c9f96)), closes [#137](https://github.com/nuxt-community/nuxt-i18n/issues/137)



<a name="5.4.2"></a>
## [5.4.2](https://github.com/nuxt-community/nuxt-i18n/compare/v5.4.1...v5.4.2) (2018-10-12)


### Bug Fixes

* Revert "feat: i18n.locale property changes when route changed" ([9e04b00](https://github.com/nuxt-community/nuxt-i18n/commit/9e04b00))



<a name="5.4.1"></a>
## [5.4.1](https://github.com/nuxt-community/nuxt-i18n/compare/v5.4.0...v5.4.1) (2018-10-11)


### Bug Fixes

* Include Types in NPM bundle (when published) ([fc67f4e](https://github.com/nuxt-community/nuxt-i18n/commit/fc67f4e))



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

[4.x to 5.x migration path](https://nuxt-community.github.io/nuxt-i18n/migrating.html#upgrading-from-4-x-to-5-x)

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

[3.x to 4.x migration path](https://nuxt-community.github.io/nuxt-i18n/migrating.html#upgrading-from-3-x-to-4-x)

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

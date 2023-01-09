

### [7.3.1](https://github.com/nuxt-community/i18n-module/compare/v7.3.0...v7.3.1) (2023-01-09)


### Bug Fixes

* don't expose full project path throuh `langDir` option ([#1786](https://github.com/nuxt-community/i18n-module/issues/1786)) ([0738a0f](https://github.com/nuxt-community/i18n-module/commit/0738a0f4e1cf1758bb44d019642017c88e0b1685))

## [7.3.0](https://github.com/nuxt-community/i18n-module/compare/v7.2.3...v7.3.0) (2022-08-24)


### Features

* add setting for setting expiration of the cookie that stores locale ([#1492](https://github.com/nuxt-community/i18n-module/issues/1492)) ([dd764d7](https://github.com/nuxt-community/i18n-module/commit/dd764d74f3e21640904889c981eb8eb8b4874e4a))

### [7.2.3](https://github.com/nuxt-community/i18n-module/compare/v7.2.2...v7.2.3) (2022-08-01)


### Bug Fixes

* infinite redirect on URL with special characters ([#1472](https://github.com/nuxt-community/i18n-module/issues/1472)) ([426af76](https://github.com/nuxt-community/i18n-module/commit/426af769d5f55d9eeaa3078a8c244caa2d0a7b68))

### [7.2.2](https://github.com/nuxt-community/i18n-module/compare/v7.2.1...v7.2.2) (2022-04-25)


### Bug Fixes

* fixed locale changing issue in server side middleware ([#1429](https://github.com/nuxt-community/i18n-module/issues/1429)) ([c10231d](https://github.com/nuxt-community/i18n-module/commit/c10231df0aab40ce8f72aca45730ab1d61464f7c))

### [7.2.1](https://github.com/nuxt-community/i18n-module/compare/v7.2.0...v7.2.1) (2022-04-01)


### Bug Fixes

* don't detect locale from route when using no_prefix ([#1421](https://github.com/nuxt-community/i18n-module/issues/1421)) ([609782f](https://github.com/nuxt-community/i18n-module/commit/609782f49c93b889b4f2494f5d21a16f96fc5ac9))
* **docs:** add info on using dynamic translations with _.vue ([b6039d2](https://github.com/nuxt-community/i18n-module/commit/b6039d2215945319fdbd1acf8dc981cc55c3bc8d)), closes [#1400](https://github.com/nuxt-community/i18n-module/issues/1400)
* **docs:** correct links to [Custom paths] and [Ignore routes] ([#1392](https://github.com/nuxt-community/i18n-module/issues/1392)) ([091944c](https://github.com/nuxt-community/i18n-module/commit/091944cec97c13a7192dcd5b6650cc8ecd348a1e))
* **parse-pages:** add jsx plugin for .vue files using jsx syntax ([#1356](https://github.com/nuxt-community/i18n-module/issues/1356)) ([8cdb999](https://github.com/nuxt-community/i18n-module/commit/8cdb99917c021492ec8208eeecec7b01dd1b4ce5))## [7.2.0](https://github.com/nuxt-community/i18n-module/compare/v7.1.0...v7.2.0) (2021-11-04)


### Features

* expose hook for extending messages ([#1319](https://github.com/nuxt-community/i18n-module/issues/1319)) ([696bd12](https://github.com/nuxt-community/i18n-module/commit/696bd1260d731feade80eaa0ad8ff0febe53f3a7))


### Bug Fixes

* **docs:** refactor and separate some pages related to routing ([89eb12f](https://github.com/nuxt-community/i18n-module/commit/89eb12f54dd44088d0718c30756774c24fcb25d9))
* load vue-template-compiler with nuxt.resolver.requireModule ([#1327](https://github.com/nuxt-community/i18n-module/issues/1327)) ([c5a3ca8](https://github.com/nuxt-community/i18n-module/commit/c5a3ca861e36ff9602d34c20321667676025af8b))

## [7.1.0](https://github.com/nuxt-community/i18n-module/compare/v7.0.3...v7.1.0) (2021-10-19)


### Features

* add support for query params in canonical url ([#1274](https://github.com/nuxt-community/i18n-module/issues/1274)) ([d5dea9c](https://github.com/nuxt-community/i18n-module/commit/d5dea9c6a047e5e25a13904c3a2cb8ffa4fdf089))


### Bug Fixes

* adjust strange redirection logic for prefix_and_default ([#1304](https://github.com/nuxt-community/i18n-module/issues/1304)) ([578acd8](https://github.com/nuxt-community/i18n-module/commit/578acd8ce506991aa02f8b7b1b81e364df1d7063))

### [7.0.3](https://github.com/nuxt-community/i18n-module/compare/v7.0.2...v7.0.3) (2021-08-31)


### Bug Fixes

* crash on using $nuxtI18nHead from nuxt.config's head ([#1273](https://github.com/nuxt-community/i18n-module/issues/1273)) ([b4aae9d](https://github.com/nuxt-community/i18n-module/commit/b4aae9dc748c2cee4d4c0b4ff9bb67b61a01969f)), closes [#1266](https://github.com/nuxt-community/i18n-module/issues/1266)

### [7.0.2](https://github.com/nuxt-community/i18n-module/compare/v7.0.1...v7.0.2) (2021-08-12)


### Bug Fixes

* **differentDomains:** handling of runtime domains from store ([#1183](https://github.com/nuxt-community/i18n-module/issues/1183)) ([4d77019](https://github.com/nuxt-community/i18n-module/commit/4d77019f786086b9e496661f8c8d55893556e31d))

### [7.0.1](https://github.com/nuxt-community/i18n-module/compare/v7.0.0...v7.0.1) (2021-08-05)


### Bug Fixes

* return the redirect path when resolving redirects with localePath ([#1253](https://github.com/nuxt-community/i18n-module/issues/1253)) ([3538f77](https://github.com/nuxt-community/i18n-module/commit/3538f77303e52e4f7aa710c24b9a371421c34deb)), closes [#1248](https://github.com/nuxt-community/i18n-module/issues/1248)

## [7.0.0](https://github.com/nuxt-community/i18n-module/compare/v6.28.1...v7.0.0) (2021-08-03)


### ⚠ BREAKING CHANGES

* rename package to @nuxtjs/i18n
* set redirectOn to root by default (#1244)
* remove vuex syncLocale & vuex syncMessages (#1240)
* disable addDirAttribute by default (#1239)
* replace onlyOnNoPrefix and onlyOnRoot with redirectOn (#1210)
* remove deprecated seo option (#1232)
* remove deprecated $nuxtI18nSeo (#1207)
* **types:** remove deprecated NuxtVueI18n (#1206)
* remove deprecated beforeLanguageSwitch (#1200)

### Code Refactoring

* disable addDirAttribute by default ([#1239](https://github.com/nuxt-community/i18n-module/issues/1239)) ([eac6130](https://github.com/nuxt-community/i18n-module/commit/eac613061c7889766221524ef8a9c5772d4e915f))
* remove deprecated $nuxtI18nSeo ([#1207](https://github.com/nuxt-community/i18n-module/issues/1207)) ([d8134a3](https://github.com/nuxt-community/i18n-module/commit/d8134a31272ba564ae57988db0221780044b475d))
* remove deprecated beforeLanguageSwitch ([#1200](https://github.com/nuxt-community/i18n-module/issues/1200)) ([d591662](https://github.com/nuxt-community/i18n-module/commit/d5916624285254f1247a835626f9a5d21b4acd79))
* remove deprecated seo option ([#1232](https://github.com/nuxt-community/i18n-module/issues/1232)) ([bedf2b8](https://github.com/nuxt-community/i18n-module/commit/bedf2b8d649828aaea8a78e064a55a7977113314))
* remove vuex syncLocale & vuex syncMessages ([#1240](https://github.com/nuxt-community/i18n-module/issues/1240)) ([399f1a3](https://github.com/nuxt-community/i18n-module/commit/399f1a3f15c0298c53ca2a02256eb71cfd6c3031))
* rename package to @nuxtjs/i18n ([b3ef21c](https://github.com/nuxt-community/i18n-module/commit/b3ef21c9947acc8e73d2b971fdccd77b9765a96f))
* replace onlyOnNoPrefix and onlyOnRoot with redirectOn ([#1210](https://github.com/nuxt-community/i18n-module/issues/1210)) ([2eb955a](https://github.com/nuxt-community/i18n-module/commit/2eb955ac57362bba72bd2171a4d37fda2be840d5))
* set redirectOn to root by default ([#1244](https://github.com/nuxt-community/i18n-module/issues/1244)) ([956df98](https://github.com/nuxt-community/i18n-module/commit/956df98275e7dfc3388787794502c0c25aaa10a8))
* **types:** remove deprecated NuxtVueI18n ([#1206](https://github.com/nuxt-community/i18n-module/issues/1206)) ([e96688c](https://github.com/nuxt-community/i18n-module/commit/e96688c2aba87bbc2318cc348264ac63febe4d53))

### [6.28.1](https://github.com/nuxt-community/i18n-module/compare/v6.28.0...v6.28.1) (2021-08-03)


### Bug Fixes

* error on loading when using nuxt-vite ([#1251](https://github.com/nuxt-community/i18n-module/issues/1251)) ([cb67e05](https://github.com/nuxt-community/i18n-module/commit/cb67e05c80963752e515893e8bf28466a43ee69d))

## [6.28.0](https://github.com/nuxt-community/i18n-module/compare/v6.27.3...v6.28.0) (2021-07-22)


### Features

* allow disabling route sorting ([#1241](https://github.com/nuxt-community/i18n-module/issues/1241)) ([8a6a056](https://github.com/nuxt-community/i18n-module/commit/8a6a05642819ece16ca9e38211449313254cd500))


### Bug Fixes

* custom routes with optional params adjusted incorrectly ([#1243](https://github.com/nuxt-community/i18n-module/issues/1243)) ([203f3db](https://github.com/nuxt-community/i18n-module/commit/203f3dbee2618ba1c598d53db00564f73e848def))
* don't skip the cookie if no locale is detected in the route ([#1235](https://github.com/nuxt-community/i18n-module/issues/1235)) ([6c9b48f](https://github.com/nuxt-community/i18n-module/commit/6c9b48fcd4a4421c118574e68e4b67a13180d502))

### [6.27.3](https://github.com/nuxt-community/i18n-module/compare/v6.27.2...v6.27.3) (2021-07-09)


### Bug Fixes

* redirect without appending extra chars ([#1214](https://github.com/nuxt-community/i18n-module/issues/1214)) ([0527d63](https://github.com/nuxt-community/i18n-module/commit/0527d63b99cf30fbe71bd62ded731de3a86798fc))

### [6.27.2](https://github.com/nuxt-community/i18n-module/compare/v6.27.1...v6.27.2) (2021-06-23)


### Bug Fixes

* ensure localeProperties is reactive (on locale change) ([#1208](https://github.com/nuxt-community/i18n-module/issues/1208)) ([d2dd400](https://github.com/nuxt-community/i18n-module/commit/d2dd4006e82734bc037cf19ef28d6e91bf1c0c83))
* **types:** fix compatibility issue with typescript 4.3.x+ ([#1205](https://github.com/nuxt-community/i18n-module/issues/1205)) ([acc1145](https://github.com/nuxt-community/i18n-module/commit/acc11452141287f5b3b84fb06ee92678fcb1279d))

### [6.27.1](https://github.com/nuxt-community/i18n-module/compare/v6.27.0...v6.27.1) (2021-06-15)


### Bug Fixes

* **types:** fix "lazy" type in deprecated types ([#1190](https://github.com/nuxt-community/i18n-module/issues/1190)) ([482317b](https://github.com/nuxt-community/i18n-module/commit/482317b4576b42204560ad0efd9cf9ac92940f90))
* handle protocol in the domain key for different domains ([#1169](https://github.com/nuxt-community/i18n-module/issues/1169)) ([45b2b82](https://github.com/nuxt-community/i18n-module/commit/45b2b82f64152c8173e6b63ab0b4154e097a34c4))

## [6.27.0](https://github.com/nuxt-community/i18n-module/compare/v6.26.0...v6.27.0) (2021-05-07)


### Features

* add onBeforeLanguageSwitch API ([#1164](https://github.com/nuxt-community/i18n-module/issues/1164)) ([5f5d748](https://github.com/nuxt-community/i18n-module/commit/5f5d748f04e3518002b1b28dfc17170072be4924))

## [6.26.0](https://github.com/nuxt-community/i18n-module/compare/v6.25.0...v6.26.0) (2021-04-20)


### Features

* **lazy:** option for not injecting messages to Nuxt state ([#1153](https://github.com/nuxt-community/i18n-module/issues/1153)) ([2231f3b](https://github.com/nuxt-community/i18n-module/commit/2231f3b400535c4fefff6f0ae3d3e81aae349e6e)), closes [#1149](https://github.com/nuxt-community/i18n-module/issues/1149)

## [6.25.0](https://github.com/nuxt-community/i18n-module/compare/v6.24.0...v6.25.0) (2021-04-13)


### Features

* **types:** add NuxtI18nInstance type for use with custom accessors ([#1147](https://github.com/nuxt-community/i18n-module/issues/1147)) ([aa4f4d8](https://github.com/nuxt-community/i18n-module/commit/aa4f4d8e9fe620f809444e3ba77954f965f92459)), closes [#1146](https://github.com/nuxt-community/i18n-module/issues/1146)

## [6.24.0](https://github.com/nuxt-community/i18n-module/compare/v6.23.0...v6.24.0) (2021-04-09)


### Features

* add localeLocation API ([#1142](https://github.com/nuxt-community/i18n-module/issues/1142)) ([c587d23](https://github.com/nuxt-community/i18n-module/commit/c587d230b866fb2937a8c63dda2efdee12f21a02)), closes [#776](https://github.com/nuxt-community/i18n-module/issues/776)


### Bug Fixes

* **types:** more specific types for $nuxtI18nHead/$nuxtI18nSeo ([02cc072](https://github.com/nuxt-community/i18n-module/commit/02cc072b4bd7c6fe2ca4a745c7a28238f0a48f45)), closes [#1133](https://github.com/nuxt-community/i18n-module/issues/1133)

## [6.23.0](https://github.com/nuxt-community/i18n-module/compare/v6.22.3...v6.23.0) (2021-04-07)


### Features

* support loading messages from file without lazy-loading ([#1130](https://github.com/nuxt-community/i18n-module/issues/1130)) ([03618fb](https://github.com/nuxt-community/i18n-module/commit/03618fbe7fcddd7033a5f3ebcba3b68eb936da8d)), closes [#412](https://github.com/nuxt-community/i18n-module/issues/412)


### Bug Fixes

* IE11 compatibility issue due to is-https package ([#1138](https://github.com/nuxt-community/i18n-module/issues/1138)) ([dcf43de](https://github.com/nuxt-community/i18n-module/commit/dcf43de88640dacb7823a84eba9f055cd03ddabf)), closes [#1137](https://github.com/nuxt-community/i18n-module/issues/1137)
* **types:** misplaced jsdoc deprecated wrong API ([9736bf1](https://github.com/nuxt-community/i18n-module/commit/9736bf1a68aeb7bb275f3b092c0911b69627ea04))

### [6.22.3](https://github.com/nuxt-community/i18n-module/compare/v6.22.2...v6.22.3) (2021-03-30)


### Bug Fixes

* **lazy:** message function not working when using lazy loading ([#1125](https://github.com/nuxt-community/i18n-module/issues/1125)) ([68b580e](https://github.com/nuxt-community/i18n-module/commit/68b580e2690d07c5b4383ea8ca53acab24304e14)), closes [#1124](https://github.com/nuxt-community/i18n-module/issues/1124)

### [6.22.2](https://github.com/nuxt-community/i18n-module/compare/v6.22.1...v6.22.2) (2021-03-26)


### Bug Fixes

* crash registering the vue-i18n-loader in old Node versions ([43022c4](https://github.com/nuxt-community/i18n-module/commit/43022c46a107c71d5ddc1bb3f0b93c63ac47853e))

### [6.22.1](https://github.com/nuxt-community/i18n-module/compare/v6.22.0...v6.22.1) (2021-03-25)


### Bug Fixes

* move lodash.merge to dependencies ([b3f3f43](https://github.com/nuxt-community/i18n-module/commit/b3f3f436e46d59f928c80d479be83e5c68e7d7dc))

## [6.22.0](https://github.com/nuxt-community/i18n-module/compare/v6.21.1...v6.22.0) (2021-03-24)


### Features

* add i18n APIs to Nuxt Context ([#1120](https://github.com/nuxt-community/i18n-module/issues/1120)) ([394ec7d](https://github.com/nuxt-community/i18n-module/commit/394ec7d72d06a1d649d6b8d39868bc2d323580f2)), closes [#1112](https://github.com/nuxt-community/i18n-module/issues/1112)


### Bug Fixes

* router base not considered on redirecting in static mode ([#1119](https://github.com/nuxt-community/i18n-module/issues/1119)) ([75b7c6e](https://github.com/nuxt-community/i18n-module/commit/75b7c6ea4ca96e2d5935344871efc8166ad1d0f0)), closes [#1060](https://github.com/nuxt-community/i18n-module/issues/1060)

### [6.21.1](https://github.com/nuxt-community/i18n-module/compare/v6.21.0...v6.21.1) (2021-03-15)


### Bug Fixes

* only replace ".js" at the end of the resolved klona path ([#1110](https://github.com/nuxt-community/i18n-module/issues/1110)) ([204d77d](https://github.com/nuxt-community/i18n-module/commit/204d77d4e8b07b007fd2bba2cda3914818ac53d2)), closes [#1109](https://github.com/nuxt-community/i18n-module/issues/1109)
* page not updated on changing lazy locale files (dev mode) ([#1104](https://github.com/nuxt-community/i18n-module/issues/1104)) ([e1ff096](https://github.com/nuxt-community/i18n-module/commit/e1ff096846c7e7ad42e1ba503d9059a1b305a1da)), closes [#905](https://github.com/nuxt-community/i18n-module/issues/905)

## [6.21.0](https://github.com/nuxt-community/i18n-module/compare/v6.20.6...v6.21.0) (2021-03-10)


### Features

* **vuex:** expose nuxt-i18n API on store ([#1098](https://github.com/nuxt-community/i18n-module/issues/1098)) ([3ea3d4d](https://github.com/nuxt-community/i18n-module/commit/3ea3d4d4a539a1e60588d807a0be8990c7342892)), closes [#1031](https://github.com/nuxt-community/i18n-module/issues/1031)


### Bug Fixes

* localePath/localeRoute missing query params ([#1103](https://github.com/nuxt-community/i18n-module/issues/1103)) ([0a95790](https://github.com/nuxt-community/i18n-module/commit/0a957902059bab94f2b6747de3bf63e3ff4a6e10))

### [6.20.6](https://github.com/nuxt-community/i18n-module/compare/v6.20.5...v6.20.6) (2021-03-08)


### Bug Fixes

* ensure langDir is escaped on Windows ([#1097](https://github.com/nuxt-community/i18n-module/issues/1097)) ([a0a3adc](https://github.com/nuxt-community/i18n-module/commit/a0a3adc13bb16d4ec4ffcdd94e24b318f8e9bbad))

### [6.20.5](https://github.com/nuxt-community/i18n-module/compare/v6.20.4...v6.20.5) (2021-03-08)


### Bug Fixes

* don't apply any locale-logic to non-existent routes ([#1093](https://github.com/nuxt-community/i18n-module/issues/1093)) ([7180412](https://github.com/nuxt-community/i18n-module/commit/71804129dcf1dd9882cfbddeee33b3253a107b4d)), closes [#1092](https://github.com/nuxt-community/i18n-module/issues/1092)
* recursive clone triggered when "locales" object made reactive ([#1090](https://github.com/nuxt-community/i18n-module/issues/1090)) ([83c4398](https://github.com/nuxt-community/i18n-module/commit/83c4398e20d409ebf7ce5304452b9c6a22a6e1d1)), closes [#1075](https://github.com/nuxt-community/i18n-module/issues/1075)
* support localePath with path input and customized routes ([#1088](https://github.com/nuxt-community/i18n-module/issues/1088)) ([4043968](https://github.com/nuxt-community/i18n-module/commit/4043968c1f57b7dd3e0bd3a9aaa24648f1060007))
* **docs:** adjusted example code in documentation to call the right context ([#1087](https://github.com/nuxt-community/i18n-module/issues/1087)) ([7b8f77d](https://github.com/nuxt-community/i18n-module/commit/7b8f77dd556335d5bf9c6c5a82b432490a5dcf71))

### [6.20.4](https://github.com/nuxt-community/i18n-module/compare/v6.20.3...v6.20.4) (2021-03-01)


### Bug Fixes

* avoid using commonjs for runtime (vite support) ([3fc14ba](https://github.com/nuxt-community/i18n-module/commit/3fc14ba255f0791d5a8f13edd23a301e56665dca))
* use mjs version of klona ([#1079](https://github.com/nuxt-community/i18n-module/issues/1079)) ([bb0445d](https://github.com/nuxt-community/i18n-module/commit/bb0445db55403cc6e13b60df87d05a242d2e5463))

### [6.20.3](https://github.com/nuxt-community/i18n-module/compare/v6.20.2...v6.20.3) (2021-02-24)


### Bug Fixes

* **lazy:** allow extensions yml/yaml when loading lazy locales ([01f92ae](https://github.com/nuxt-community/i18n-module/commit/01f92ae72ba2a37cda2be119f618751ab7dbf20b))

### [6.20.2](https://github.com/nuxt-community/i18n-module/compare/v6.20.1...v6.20.2) (2021-02-19)


### Bug Fixes

* **lazy:** only process lang files with js, ts and json extensions ([#1070](https://github.com/nuxt-community/i18n-module/issues/1070)) ([1cf1ac2](https://github.com/nuxt-community/i18n-module/commit/1cf1ac2d031b924b4d2b82113f7580cfa18f7efa)), closes [#1068](https://github.com/nuxt-community/i18n-module/issues/1068)

### [6.20.1](https://github.com/nuxt-community/i18n-module/compare/v6.20.0...v6.20.1) (2021-02-15)


### Bug Fixes

* compatibility issue with Nuxt 2.15.0 ([9d276d7](https://github.com/nuxt-community/i18n-module/commit/9d276d7943ada9f96cf27d870b0072fae83e9c33)), closes [#1063](https://github.com/nuxt-community/i18n-module/issues/1063)
* **docs:** missing semicolon in Locales option example ([#1056](https://github.com/nuxt-community/i18n-module/issues/1056)) ([e9f2a6a](https://github.com/nuxt-community/i18n-module/commit/e9f2a6a4e07d89bdb4212f43bf2062e0186c8041))

## [6.20.0](https://github.com/nuxt-community/i18n-module/compare/v6.19.0...v6.20.0) (2021-02-03)


### Features

* API for handling locale change during page transitions ([#963](https://github.com/nuxt-community/i18n-module/issues/963)) ([23b9cc4](https://github.com/nuxt-community/i18n-module/commit/23b9cc4b9b831c91248f840ff1b9229824ed7268))

## [6.19.0](https://github.com/nuxt-community/i18n-module/compare/v6.18.0...v6.19.0) (2021-02-01)


### Features

* add dir property and defaultDirection option ([#1023](https://github.com/nuxt-community/i18n-module/issues/1023)) ([3b3dcc6](https://github.com/nuxt-community/i18n-module/commit/3b3dcc6ba418ce6250498225873da3a063c8321c))


### Bug Fixes

* invalid canonical SEO link with differentDomains ([#1049](https://github.com/nuxt-community/i18n-module/issues/1049)) ([d05317b](https://github.com/nuxt-community/i18n-module/commit/d05317be2eb26a211f1783c35a966b9d779feeb8))
* **deps:** update all non-major dependencies ([#1048](https://github.com/nuxt-community/i18n-module/issues/1048)) ([8f4cef5](https://github.com/nuxt-community/i18n-module/commit/8f4cef5d5335138e638e2c58b75ab77602f25c65))
* localeProperties undefined when <i18n> component used ([#1043](https://github.com/nuxt-community/i18n-module/issues/1043)) ([ff56a35](https://github.com/nuxt-community/i18n-module/commit/ff56a35a052487b17632e5ad6f08bf588f94f966))

## [6.18.0](https://github.com/nuxt-community/i18n-module/compare/v6.17.0...v6.18.0) (2021-01-13)


### Features

* expose API for detecting browser locale ([#1022](https://github.com/nuxt-community/i18n-module/issues/1022)) ([ac75635](https://github.com/nuxt-community/i18n-module/commit/ac75635d963104498e876040b111dd8d16fef6d3)), closes [#1018](https://github.com/nuxt-community/i18n-module/issues/1018)
* expose localeProperties property ([#1016](https://github.com/nuxt-community/i18n-module/issues/1016)) ([a9457a0](https://github.com/nuxt-community/i18n-module/commit/a9457a02177e230ec4529a96b97b3aa2993b9ec2)), closes [#916](https://github.com/nuxt-community/i18n-module/issues/916)

## [6.17.0](https://github.com/nuxt-community/i18n-module/compare/v6.16.0...v6.17.0) (2021-01-05)


### Features

* **fallbackLocale:** support vue-i18n decision map fallback ([#992](https://github.com/nuxt-community/i18n-module/issues/992)) ([b4c6cfd](https://github.com/nuxt-community/i18n-module/commit/b4c6cfd9968562c35c6e6a1b0e6805efb6945d47))


### Bug Fixes

* use local klona dependency from the plugin ([#1008](https://github.com/nuxt-community/i18n-module/issues/1008)) ([42c3cd5](https://github.com/nuxt-community/i18n-module/commit/42c3cd5595e4fcc06866c373a1a430e6f1b337c6)), closes [#1004](https://github.com/nuxt-community/i18n-module/issues/1004)
* **deps:** update dependency is-https to v3 ([#997](https://github.com/nuxt-community/i18n-module/issues/997)) ([cd377b4](https://github.com/nuxt-community/i18n-module/commit/cd377b49441465de3283e68b253e984077d24ac3))

## [6.16.0](https://github.com/nuxt-community/i18n-module/compare/v6.15.4...v6.16.0) (2020-12-09)


### Features

* "onlyOnNoPrefix" - detect browser locale when no prefix ([#896](https://github.com/nuxt-community/i18n-module/issues/896)) ([15f0a44](https://github.com/nuxt-community/i18n-module/commit/15f0a4444b22ff99c5d07814e8d30a3e68a73720))


### Bug Fixes

* **detectBrowserLanguage:** use ISO code if available ([#965](https://github.com/nuxt-community/i18n-module/issues/965)) ([1e39a3b](https://github.com/nuxt-community/i18n-module/commit/1e39a3bf43010d05f5d52a3b046020ccfb23d7cc)), closes [#979](https://github.com/nuxt-community/i18n-module/issues/979) [#499](https://github.com/nuxt-community/i18n-module/issues/499)
* **docs:** add defaultLocale to examples ([#955](https://github.com/nuxt-community/i18n-module/issues/955)) ([4b69c6c](https://github.com/nuxt-community/i18n-module/commit/4b69c6c72fe7217ede1d687fa7f4a0fbcc04285c))
* **docs:** add missing parenthesis ([#941](https://github.com/nuxt-community/i18n-module/issues/941)) ([4ecdee1](https://github.com/nuxt-community/i18n-module/commit/4ecdee1cadd9c46a19bf932e1f7a933728b45282))
* **docs:** clarify the type of the "vueI18n" option ([c9be559](https://github.com/nuxt-community/i18n-module/commit/c9be559b0e2560641d41fa0d3ca40e4f3b981cc7))
* **docs:** fix some links in the documentation ([1249226](https://github.com/nuxt-community/i18n-module/commit/12492263ce923f3fb8aa97c7b8a8fdf9affef860))
* **docs:** fix some more links in the documentation ([abbf212](https://github.com/nuxt-community/i18n-module/commit/abbf212f1694d1fb295a6386bd7001315e442232))
* **docs:** include "defaultLocale" in the example configuration ([#951](https://github.com/nuxt-community/i18n-module/issues/951)) ([6bacb3b](https://github.com/nuxt-community/i18n-module/commit/6bacb3b18f9cd15a6f4e60139f8f23106b39f218))
* **docs:** remove unwanted characters ([bc9f76e](https://github.com/nuxt-community/i18n-module/commit/bc9f76e4bbc69f1be895a60704448a0a6519bbfe)), closes [#960](https://github.com/nuxt-community/i18n-module/issues/960)
* **generate:** don't try to redirect route when static generating ([#989](https://github.com/nuxt-community/i18n-module/issues/989)) ([d5957d0](https://github.com/nuxt-community/i18n-module/commit/d5957d057c819049c9d73a526fb6752c428a67c6)), closes [#911](https://github.com/nuxt-community/i18n-module/issues/911)
* **test:** fix test expectation for trailingSlash=true ([c9f2ef5](https://github.com/nuxt-community/i18n-module/commit/c9f2ef52a844990e0ffa373c7eae83873814d34d))

### [6.15.4](https://github.com/nuxt-community/i18n-module/compare/v6.15.3...v6.15.4) (2020-10-19)


### Bug Fixes

* node-libs-browser being imported on the client ([#936](https://github.com/nuxt-community/i18n-module/issues/936)) ([7490ae9](https://github.com/nuxt-community/i18n-module/commit/7490ae9b742bd60d4f9f8f81f5b540491380c84f)), closes [#907](https://github.com/nuxt-community/i18n-module/issues/907) [#935](https://github.com/nuxt-community/i18n-module/issues/935)

### [6.15.3](https://github.com/nuxt-community/i18n-module/compare/v6.15.2...v6.15.3) (2020-10-14)


### Bug Fixes

* don't use optional chaining for compatibility reasons ([#930](https://github.com/nuxt-community/i18n-module/issues/930)) ([2d96629](https://github.com/nuxt-community/i18n-module/commit/2d96629e71d36a0901ce0ef255d6e730338e0ede)), closes [#929](https://github.com/nuxt-community/i18n-module/issues/929)

### [6.15.2](https://github.com/nuxt-community/i18n-module/compare/v6.15.1...v6.15.2) (2020-10-13)


### Bug Fixes

* **docs:** add warnings regarding no_prefix strategy ([#891](https://github.com/nuxt-community/i18n-module/issues/891)) ([bbcbad9](https://github.com/nuxt-community/i18n-module/commit/bbcbad96955b07d81168f61059cca7ebdb6995f6))
* **seo:** don't include queries in canonical tag ([d09ad9e](https://github.com/nuxt-community/i18n-module/commit/d09ad9e6f521a1c193fdb05f1ed2f26289586847)), closes [#912](https://github.com/nuxt-community/i18n-module/issues/912)
* **seo:** enable canonical tag for all strategies ([4ae4199](https://github.com/nuxt-community/i18n-module/commit/4ae41997017faa0e7900274f725eee010e523dae))
* **seo:** enable self-referential canonical tags ([b62fd39](https://github.com/nuxt-community/i18n-module/commit/b62fd39718f1bde419897ca9348b058b637ca2a6))
* add x-default hreflang tag for improved SEO ([#922](https://github.com/nuxt-community/i18n-module/issues/922)) ([b35bc57](https://github.com/nuxt-community/i18n-module/commit/b35bc579cb6431953e8473f4bd4fd5dbbed33426))

### [6.15.1](https://github.com/nuxt-community/i18n-module/compare/v6.15.0...v6.15.1) (2020-09-11)


### Bug Fixes

* ("prefix" strategy) redirect from root doesn't respect cookie locale ([#890](https://github.com/nuxt-community/i18n-module/issues/890)) ([d3b09f5](https://github.com/nuxt-community/i18n-module/commit/d3b09f55252e6a436842500d0f04e8360c711291)), closes [#887](https://github.com/nuxt-community/i18n-module/issues/887)
* add plugins from the main context to have consistent loading order ([#889](https://github.com/nuxt-community/i18n-module/issues/889)) ([1ec8814](https://github.com/nuxt-community/i18n-module/commit/1ec8814e5aaf5849153ac640eea3891caf9b5214)), closes [#874](https://github.com/nuxt-community/i18n-module/issues/874)
* **docs:** refactor options documentation ([#888](https://github.com/nuxt-community/i18n-module/issues/888)) ([5f295be](https://github.com/nuxt-community/i18n-module/commit/5f295befc35156ca1c7d08ba3d737810b354e66b))

## [6.15.0](https://github.com/nuxt-community/i18n-module/compare/v6.14.2...v6.15.0) (2020-09-10)


### Features

* add option to only detect browser locale on root path ([#799](https://github.com/nuxt-community/i18n-module/issues/799)) ([7bdb227](https://github.com/nuxt-community/i18n-module/commit/7bdb227dfb6c2c4ee1474f09add28dd8afc99764)), closes [#455](https://github.com/nuxt-community/i18n-module/issues/455) [#761](https://github.com/nuxt-community/i18n-module/issues/761)


### Bug Fixes

* **differentDomains:** Match domain properly on client if port provided ([#832](https://github.com/nuxt-community/i18n-module/issues/832)) ([3a0bc88](https://github.com/nuxt-community/i18n-module/commit/3a0bc88e6acb5c08d1d0f5567bc9f9ce12db56d4))

### [6.14.2](https://github.com/nuxt-community/i18n-module/compare/v6.14.1...v6.14.2) (2020-09-08)


### Bug Fixes

* fails at extending routes when followed by another module ([#884](https://github.com/nuxt-community/i18n-module/issues/884)) ([c0d136b](https://github.com/nuxt-community/i18n-module/commit/c0d136b83a4998926500ed90e34c4223f98034b9)), closes [#157](https://github.com/nuxt-community/i18n-module/issues/157)

### [6.14.1](https://github.com/nuxt-community/i18n-module/compare/v6.14.0...v6.14.1) (2020-09-08)


### Bug Fixes

* remove postinstall script that breaks production ([56f8084](https://github.com/nuxt-community/i18n-module/commit/56f8084f44c80eb30c43684a0adf474162679245))

## [6.14.0](https://github.com/nuxt-community/i18n-module/compare/v6.13.12...v6.14.0) (2020-09-08)


### Features

* add "cookieSecure" setting to set the Secure flag on the cookie ([#869](https://github.com/nuxt-community/i18n-module/issues/869)) ([0f2d762](https://github.com/nuxt-community/i18n-module/commit/0f2d7629d456400ef3d9a25e4bc9d871b6b1d128))
* **docs:** migrate docs to Nuxt Content ([#864](https://github.com/nuxt-community/i18n-module/issues/864)) ([affb845](https://github.com/nuxt-community/i18n-module/commit/affb8450bacee2a58c6cd716dd3934b296ba60a5))
* add setting to use cross-origin cookie for "detectBrowserLocale" ([#853](https://github.com/nuxt-community/i18n-module/issues/853)) ([e446676](https://github.com/nuxt-community/i18n-module/commit/e4466767d30d9b4ef2078a97f11354fbac5f2b03))


### Bug Fixes

* only import build-time dependency at build time ([#875](https://github.com/nuxt-community/i18n-module/issues/875)) ([095cc78](https://github.com/nuxt-community/i18n-module/commit/095cc78ca46a075b979fd9f35a518b1d8a613969))
* **deps:** pin dependencies ([#865](https://github.com/nuxt-community/i18n-module/issues/865)) ([d66545f](https://github.com/nuxt-community/i18n-module/commit/d66545f73b198f12095a852c02c3639d10629b53))
* **docs:** fix various documentation links after migration ([19c516c](https://github.com/nuxt-community/i18n-module/commit/19c516c66b3e3f9a39af51b11591d965b945dc84))
* **docs:** typo in Spanish accent mark ([#867](https://github.com/nuxt-community/i18n-module/issues/867)) ([4fadb8b](https://github.com/nuxt-community/i18n-module/commit/4fadb8b9f7bb03c954640038b03b32e355b732a6))

### [6.13.12](https://github.com/nuxt-community/i18n-module/compare/v6.13.11...v6.13.12) (2020-08-22)


### Bug Fixes

* force-transpile deepcopy dependency to fix IE11 ([#861](https://github.com/nuxt-community/i18n-module/issues/861)) ([9b9fec5](https://github.com/nuxt-community/i18n-module/commit/9b9fec5f6e47392a8cf0b80cf3b635d2c5d9aa0a)), closes [#860](https://github.com/nuxt-community/i18n-module/issues/860)

### [6.13.11](https://github.com/nuxt-community/i18n-module/compare/v6.13.10...v6.13.11) (2020-08-21)


### Bug Fixes

* **lazy:** null-check nuxtState as it might not exist in SPA ([#859](https://github.com/nuxt-community/i18n-module/issues/859)) ([6763390](https://github.com/nuxt-community/i18n-module/commit/676339076c3dad802dbf966863c52bae75f3c63b)), closes [#858](https://github.com/nuxt-community/i18n-module/issues/858)

### [6.13.10](https://github.com/nuxt-community/i18n-module/compare/v6.13.9...v6.13.10) (2020-08-18)


### Bug Fixes

* **routes:** fix routes being generated after other modules ([#851](https://github.com/nuxt-community/i18n-module/issues/851)) ([b453191](https://github.com/nuxt-community/i18n-module/commit/b45319182d07c471ef871d0a59cdb952ccff5803)), closes [#850](https://github.com/nuxt-community/i18n-module/issues/850)
* **types:** add types for app.localePath and co. ([#849](https://github.com/nuxt-community/i18n-module/issues/849)) ([dfd6d76](https://github.com/nuxt-community/i18n-module/commit/dfd6d76d3082e28ed42040df218e0b71b93eb590))

### [6.13.9](https://github.com/nuxt-community/i18n-module/compare/v6.13.8...v6.13.9) (2020-08-15)


### Bug Fixes

* **lazy:** failure to load locales on SPA navigation to default locale ([#846](https://github.com/nuxt-community/i18n-module/issues/846)) ([c2aafd6](https://github.com/nuxt-community/i18n-module/commit/c2aafd63601675a2745e2fe2c052ccb1cc6e2802)), closes [#843](https://github.com/nuxt-community/i18n-module/issues/843)

### [6.13.8](https://github.com/nuxt-community/i18n-module/compare/v6.13.7...v6.13.8) (2020-08-11)


### Bug Fixes

* don't crash on missing route when parsing page component options ([#841](https://github.com/nuxt-community/i18n-module/issues/841)) ([46bbdc5](https://github.com/nuxt-community/i18n-module/commit/46bbdc5e0a7403f2527dfde2c178e4da83140bdf)), closes [#838](https://github.com/nuxt-community/i18n-module/issues/838)
* null-check route to avoid rare crashes ([fc02a65](https://github.com/nuxt-community/i18n-module/commit/fc02a657578f2556277af6cee67aefd0ca1e5dc6))

### [6.13.7](https://github.com/nuxt-community/i18n-module/compare/v6.13.6...v6.13.7) (2020-08-05)


### Bug Fixes

* **lazy:** error importing file when having imports within "locale.file" ([3cb1d2a](https://github.com/nuxt-community/i18n-module/commit/3cb1d2af38cf3f14e5b2b942d9b0ef528af00b09)), closes [#835](https://github.com/nuxt-community/i18n-module/issues/835)

### [6.13.6](https://github.com/nuxt-community/i18n-module/compare/v6.13.5...v6.13.6) (2020-08-04)


### Bug Fixes

* restore compatibility with Nuxt <2.14 ([#830](https://github.com/nuxt-community/i18n-module/issues/830)) ([02f6b99](https://github.com/nuxt-community/i18n-module/commit/02f6b997e95dce50bf3d45c90f59686461c7f82e)), closes [#829](https://github.com/nuxt-community/i18n-module/issues/829)

### [6.13.5](https://github.com/nuxt-community/i18n-module/compare/v6.13.4...v6.13.5) (2020-08-04)


### Bug Fixes

* **lazy:** don't try to copy locales to build dir at run-time ([#827](https://github.com/nuxt-community/i18n-module/issues/827)) ([55dac74](https://github.com/nuxt-community/i18n-module/commit/55dac7459c3f5f50517af3009c27a2c5a46c7c82)), closes [#826](https://github.com/nuxt-community/i18n-module/issues/826)

### [6.13.4](https://github.com/nuxt-community/i18n-module/compare/v6.13.3...v6.13.4) (2020-08-04)


### Bug Fixes

* **lazy:** webpack error when only default locale exists ([#825](https://github.com/nuxt-community/i18n-module/issues/825)) ([97f1dd8](https://github.com/nuxt-community/i18n-module/commit/97f1dd8e101a69282acb509ec0d9a3202f99a1d1)), closes [#824](https://github.com/nuxt-community/i18n-module/issues/824)

### [6.13.3](https://github.com/nuxt-community/i18n-module/compare/v6.13.2...v6.13.3) (2020-08-04)


### Bug Fixes

* **lazy:** include default locale in the main bundle ([#819](https://github.com/nuxt-community/i18n-module/issues/819)) ([6ed4ae6](https://github.com/nuxt-community/i18n-module/commit/6ed4ae616a0c9b555e3966c169886d3650427e07)), closes [#818](https://github.com/nuxt-community/i18n-module/issues/818)
* **lazy:** make client use translations loaded on the server ([#823](https://github.com/nuxt-community/i18n-module/issues/823)) ([06bc5f1](https://github.com/nuxt-community/i18n-module/commit/06bc5f1fce1c1349a7b035a40fd698f5ae7ac7f1)), closes [#486](https://github.com/nuxt-community/i18n-module/issues/486) [#663](https://github.com/nuxt-community/i18n-module/issues/663)

### [6.13.2](https://github.com/nuxt-community/i18n-module/compare/v6.13.1...v6.13.2) (2020-07-31)


### Bug Fixes

* generate fallback routes for static build ([#808](https://github.com/nuxt-community/i18n-module/issues/808)) ([c2106f7](https://github.com/nuxt-community/i18n-module/commit/c2106f7185df2329d2068582b5e5a59c371c0192)), closes [#805](https://github.com/nuxt-community/i18n-module/issues/805)
* redirect loop on initial load (static mode & route with no locale) ([4c9bc13](https://github.com/nuxt-community/i18n-module/commit/4c9bc13968c96f3abd544f3b24ef90882ea10d96)), closes [#798](https://github.com/nuxt-community/i18n-module/issues/798)
* **types:** fix type of detectBrowserLanguage to allow false ([#793](https://github.com/nuxt-community/i18n-module/issues/793)) ([c62f19b](https://github.com/nuxt-community/i18n-module/commit/c62f19b527d91658b036c15a9f86399a2deded34))

### [6.13.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.13.0...v6.13.1) (2020-07-03)


### Bug Fixes

* incorrect SEO links when vue-loader forces local i18n instance ([#786](https://github.com/nuxt-community/nuxt-i18n/issues/786)) ([8cf173d](https://github.com/nuxt-community/nuxt-i18n/commit/8cf173d202869c9999e0b7cbc8a2f31b0ebedd17)), closes [#785](https://github.com/nuxt-community/nuxt-i18n/issues/785)

## [6.13.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.12.2...v6.13.0) (2020-07-02)


### Features

* pass to-be-loaded locale when lazy-loading from exported function ([#752](https://github.com/nuxt-community/nuxt-i18n/issues/752)) ([145f3b2](https://github.com/nuxt-community/nuxt-i18n/commit/145f3b2a080a91028fd5ef59f9c8bd88755d3b4b)), closes [#742](https://github.com/nuxt-community/nuxt-i18n/issues/742)


### Bug Fixes

* handling of trailing slash in localePath ([#756](https://github.com/nuxt-community/nuxt-i18n/issues/756)) ([1a69387](https://github.com/nuxt-community/nuxt-i18n/commit/1a6938784581789465b41035aadc181782c9d68e)), closes [#717](https://github.com/nuxt-community/nuxt-i18n/issues/717)
* initial redirect breaks reactivity in static mode ([54b8186](https://github.com/nuxt-community/nuxt-i18n/commit/54b8186c711389ce051b8ffbd4f30e201332e5f8)), closes [#737](https://github.com/nuxt-community/nuxt-i18n/issues/737)
* preserve query when handling rootRedirect ([#771](https://github.com/nuxt-community/nuxt-i18n/issues/771)) ([b201609](https://github.com/nuxt-community/nuxt-i18n/commit/b201609de36c11b7dd6c369bf08a7e43c9cc6b59))
* **types:** extend NuxtOptions with "i18n" (when using i18n in the root of Nuxt config) ([7c5241b](https://github.com/nuxt-community/nuxt-i18n/commit/7c5241bd17f6b5f8053b0c3b1e197be211677683))

## [6.13.0-beta.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.12.2...v6.13.0-beta.0) (2020-06-03)


### Features

* pass to-be-loaded locale when lazy-loading from exported function ([#752](https://github.com/nuxt-community/nuxt-i18n/issues/752)) ([145f3b2](https://github.com/nuxt-community/nuxt-i18n/commit/145f3b2a080a91028fd5ef59f9c8bd88755d3b4b)), closes [#742](https://github.com/nuxt-community/nuxt-i18n/issues/742)


### Bug Fixes

* initial redirect breaks reactivity in static mode ([ef80b0d](https://github.com/nuxt-community/nuxt-i18n/commit/ef80b0db8e2a74101929a063e7142b7ab5708ef0)), closes [#737](https://github.com/nuxt-community/nuxt-i18n/issues/737)

### [6.12.2](https://github.com/nuxt-community/nuxt-i18n/compare/v6.12.1...v6.12.2) (2020-06-02)


### Bug Fixes

* revert back to generating routes from extendRoutes() ([#751](https://github.com/nuxt-community/nuxt-i18n/issues/751)) ([439781f](https://github.com/nuxt-community/nuxt-i18n/commit/439781f66127cf99e4318f8774dd9b441ccfca31)), closes [#750](https://github.com/nuxt-community/nuxt-i18n/issues/750)
* **deps:** update dependency is-https to v2 ([#744](https://github.com/nuxt-community/nuxt-i18n/issues/744)) ([baf3082](https://github.com/nuxt-community/nuxt-i18n/commit/baf3082c0ac48c90a20b476a7d158e20fd2cf248))

### [6.12.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.12.0...v6.12.1) (2020-05-29)


### Bug Fixes

* crash on using nuxt-i18n properties in a component with i18n options ([#736](https://github.com/nuxt-community/nuxt-i18n/issues/736)) ([fd8b684](https://github.com/nuxt-community/nuxt-i18n/commit/fd8b684a19a109bb68066716ed92dfb02fe900a2)), closes [#557](https://github.com/nuxt-community/nuxt-i18n/issues/557)
* don't add trailing slashes to generated routes ([#733](https://github.com/nuxt-community/nuxt-i18n/issues/733)) ([b062044](https://github.com/nuxt-community/nuxt-i18n/commit/b062044998062fe217f69a1e3d00184e34b7ffc5)), closes [#717](https://github.com/nuxt-community/nuxt-i18n/issues/717)
* favor non-prefixed route with prefix_and_default strategy ([#732](https://github.com/nuxt-community/nuxt-i18n/issues/732)) ([09d2c0f](https://github.com/nuxt-community/nuxt-i18n/commit/09d2c0ff39089802db67b2db9c67e46d93fda64d)), closes [#721](https://github.com/nuxt-community/nuxt-i18n/issues/721)
* remove "encodePaths" option and don't encode paths by default ([#731](https://github.com/nuxt-community/nuxt-i18n/issues/731)) ([aba92b3](https://github.com/nuxt-community/nuxt-i18n/commit/aba92b318559521c268d2d3bbe427653bb4c14d6)), closes [#712](https://github.com/nuxt-community/nuxt-i18n/issues/712)

## [6.12.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.11.1...v6.12.0) (2020-05-25)


### Features

* add localeRoute API for getting the localized route ([#729](https://github.com/nuxt-community/nuxt-i18n/issues/729)) ([0c4bd52](https://github.com/nuxt-community/nuxt-i18n/commit/0c4bd52babdd868fdc254387589529600e1a3496)), closes [#728](https://github.com/nuxt-community/nuxt-i18n/issues/728)
* add support for using localePath with no route name and path ([#727](https://github.com/nuxt-community/nuxt-i18n/issues/727)) ([7a011a0](https://github.com/nuxt-community/nuxt-i18n/commit/7a011a07bede6bad62f9faf44873643a1a8b0ec1)), closes [#691](https://github.com/nuxt-community/nuxt-i18n/issues/691)


### Bug Fixes

* don't do browser language detection during Nuxt generate ([#718](https://github.com/nuxt-community/nuxt-i18n/issues/718)) ([f1c5aca](https://github.com/nuxt-community/nuxt-i18n/commit/f1c5aca9aa35febdb19f46c45b0cf37ba5ab3db6))
* don't leave out non-prefixed routes for generate + prefix strategy ([#726](https://github.com/nuxt-community/nuxt-i18n/issues/726)) ([97fabbf](https://github.com/nuxt-community/nuxt-i18n/commit/97fabbfafa2c7ec852f134c6587b291e4f5dfda9)), closes [#700](https://github.com/nuxt-community/nuxt-i18n/issues/700)
* trigger language detection on initial load in generated mode ([#724](https://github.com/nuxt-community/nuxt-i18n/issues/724)) ([a853de9](https://github.com/nuxt-community/nuxt-i18n/commit/a853de929d2f764ccd08c4323c6cfb8f95e4490c))

### [6.11.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.11.0...v6.11.1) (2020-05-10)


### Bug Fixes

* NavigationDuplicated error on loading 404 page in SPA ([#705](https://github.com/nuxt-community/nuxt-i18n/issues/705)) ([6bd80da](https://github.com/nuxt-community/nuxt-i18n/commit/6bd80da4ee21918abb551629720723dc82d69fc0)), closes [#702](https://github.com/nuxt-community/nuxt-i18n/issues/702)

## [6.11.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.10.1...v6.11.0) (2020-04-30)


### Features

* **docs:** enable indexed search results in documentation ([#687](https://github.com/nuxt-community/nuxt-i18n/issues/687)) ([bea56a9](https://github.com/nuxt-community/nuxt-i18n/commit/bea56a90947e1bc767efe036644437f47a9d148f))


### Bug Fixes

* redirect from 404 to defaultLocale if there is matching route ([e99978d](https://github.com/nuxt-community/nuxt-i18n/commit/e99978dcba6ecea19c915e9aa6b5865dab2bc3b8)), closes [#677](https://github.com/nuxt-community/nuxt-i18n/issues/677) [#491](https://github.com/nuxt-community/nuxt-i18n/issues/491)

### [6.10.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.10.0...v6.10.1) (2020-04-23)


### Bug Fixes

* **types:** fix type of baseUrl to allow string ([a495cb3](https://github.com/nuxt-community/nuxt-i18n/commit/a495cb3ad0c9cf42b1e0c23c5e5be7b08caefdc5))

## [6.10.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.9.3...v6.10.0) (2020-04-23)


### Features

* allow providing function for baseUrl option ([#679](https://github.com/nuxt-community/nuxt-i18n/issues/679)) ([056a8f7](https://github.com/nuxt-community/nuxt-i18n/commit/056a8f727b678fbe64496d2fb82af08443fe471c))

### [6.9.3](https://github.com/nuxt-community/nuxt-i18n/compare/v6.9.1...v6.9.3) (2020-04-23)


### Bug Fixes

* crash with latest vue-i18n related to using null locale ([#678](https://github.com/nuxt-community/nuxt-i18n/issues/678)) ([642fddf](https://github.com/nuxt-community/nuxt-i18n/commit/642fddfb4eac8bed42e537737c74d9ec7f8e10ad))
* lock vue-i18n version to 8.16.0 until crashing issue is fixed ([#673](https://github.com/nuxt-community/nuxt-i18n/issues/673)) ([9e99f19](https://github.com/nuxt-community/nuxt-i18n/commit/9e99f193ac25befd3e4cdcf40b3e92df1b443e58))

### [6.9.2](https://github.com/nuxt-community/nuxt-i18n/compare/v6.9.1...v6.9.2) (2020-04-22)


### Bug Fixes

* lock vue-i18n version to 8.16.0 until crashing issue is fixed ([ad82009](https://github.com/nuxt-community/nuxt-i18n/commit/ad820091a9004bb16d47496dff7661023fd254eb))

### [6.9.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.9.0...v6.9.1) (2020-04-14)


### Bug Fixes

* crash with invalid locale cookie + no_prefix strategy + SEO ([#666](https://github.com/nuxt-community/nuxt-i18n/issues/666)) ([2ec72bc](https://github.com/nuxt-community/nuxt-i18n/commit/2ec72bce3f5ca6841c75811bd4cf5a676a9aeafa))

## [6.9.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.8.1...v6.9.0) (2020-04-14)


### Features

* re-use the store locale on the client if set on server ([#593](https://github.com/nuxt-community/nuxt-i18n/issues/593)) ([c8b05b1](https://github.com/nuxt-community/nuxt-i18n/commit/c8b05b123288574777046302e2a258558c841410))


### Bug Fixes

* **deps:** update dependency @intlify/vue-i18n-loader to v1 ([#659](https://github.com/nuxt-community/nuxt-i18n/issues/659)) ([9886e1f](https://github.com/nuxt-community/nuxt-i18n/commit/9886e1fcad4b443b2a09b427dd92a77f2c1e299d))

### [6.8.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.8.0...v6.8.1) (2020-04-03)


### Bug Fixes

* match full browser locale case-insensitively (same as short) ([#655](https://github.com/nuxt-community/nuxt-i18n/issues/655)) ([e614e8e](https://github.com/nuxt-community/nuxt-i18n/commit/e614e8e31010a7a0114cd9ea9d01588d7c26e510)), closes [#651](https://github.com/nuxt-community/nuxt-i18n/issues/651)

## [6.8.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.7.2...v6.8.0) (2020-04-02)


### Features

* match against all language codes provided by the browser ([#651](https://github.com/nuxt-community/nuxt-i18n/pull/651)) ([93e1918)](https://github.com/nuxt-community/nuxt-i18n/commit/93e1918ce7f9e204393e24fdf649af37d4b43aee))

### [6.7.2](https://github.com/nuxt-community/nuxt-i18n/compare/v6.7.1...v6.7.2) (2020-03-31)


### Bug Fixes

* locale not updated on navigation (no fallbackLocale) ([#647](https://github.com/nuxt-community/nuxt-i18n/issues/647)) ([1ad3ed1](https://github.com/nuxt-community/nuxt-i18n/commit/1ad3ed166ad25623c6663b34e0c21dfcdfdf94ff)), closes [#643](https://github.com/nuxt-community/nuxt-i18n/issues/643)

### [6.7.1](https://github.com/nuxt-community/nuxt-i18n/compare/v6.7.0...v6.7.1) (2020-03-30)


### Bug Fixes

* don't try to use route params when vuex.syncRouteParams ([1bdf320](https://github.com/nuxt-community/nuxt-i18n/commit/1bdf3207dddbf1dde66b2ea3b938a9d1411679fb)), closes [#644](https://github.com/nuxt-community/nuxt-i18n/issues/644)

## [6.7.0](https://github.com/nuxt-community/nuxt-i18n/compare/v6.6.1...v6.7.0) (2020-03-24)


### Features

* allow customization of rootRedirect status code ([#639](https://github.com/nuxt-community/nuxt-i18n/issues/639)) ([38d8935](https://github.com/nuxt-community/nuxt-i18n/commit/38d893524eaefec05e754834689506b72aabe189))

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
# nuxt-i18n
[![npm (scoped with tag)](https://img.shields.io/npm/v/nuxt-i18n/latest.svg?style=flat-square)](https://npmjs.com/package/nuxt-i18n)
[![npm](https://img.shields.io/npm/dt/nuxt-i18n.svg?style=flat-square)](https://npmjs.com/package/nuxt-i18n)
[![CircleCI](https://img.shields.io/circleci/project/github/nuxt-community/nuxt-i18n.svg?style=flat-square)](https://circleci.com/gh/nuxt-community/nuxt-i18n)
[![Codecov](https://img.shields.io/codecov/c/github/nuxt-community/nuxt-i18n.svg?style=flat-square)](https://codecov.io/gh/nuxt-community/nuxt-i18n)
[![Dependencies](https://david-dm.org/nuxt-community/nuxt-i18n/status.svg?style=flat-square)](https://david-dm.org/nuxt-community/nuxt-i18n)
[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com)

> i18n for [Nuxt](https://github.com/nuxt/nuxt.js)

[📖 **Release Notes**](./CHANGELOG.md)

## Features

* [vue-i18n](https://github.com/kazupon/vue-i18n) integration
* Automatic routes generation prefixed with locales code
* SEO tags generation
* Translations messages lazy-loading
* Redirection based on browser language
* Different domain names for each language

## Install
- Add `nuxt-i18n` dependency using yarn or npm to your project

```sh
yarn add nuxt-i18n
# npm i nuxt-i18n -S
```

- Add `nuxt-i18n` to `modules` section of `nuxt.config.js`

```js
{
  modules: [
    ['nuxt-i18n', { /* module options */ }],
 ]
}
```


📖 [**Read Documentation**](https://nuxt-community.github.io/nuxt-i18n/) 

## License

[MIT License](./LICENSE)

Copyright (c) Paul Gascou-Vaillancourt (@paulgv)

<p align="center">
  <img src="./docs/static/preview.png" alt="@nuxtjs/i18n logo">
</p>

[![](https://david-dm.org/nuxt-community/i18n-module/status.svg?style=flat-square)](https://david-dm.org/nuxt-community/i18n-module)
[![](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
[![](https://img.shields.io/codecov/c/github/nuxt-community/i18n-module.svg?style=flat-square)](https://codecov.io/gh/nuxt-community/i18n-module)
[![](https://snyk.io/test/github/nuxt-community/i18n-module/badge.svg?style=flat-square)](https://snyk.io/test/github/nuxt-community/i18n-module)
[![](https://img.shields.io/npm/v/%40nuxtjs%2Fi18n/latest.svg?style=flat-square)](https://npmjs.com/package/%40nuxtjs%2Fi18n)
[![](https://img.shields.io/npm/dt/%40nuxtjs%2Fi18n.svg?style=flat-square)](https://npmjs.com/package/%40nuxtjs%2Fi18n)

> i18n for your Nuxt project

## Links
- 📘 [Documentation](https://i18n.nuxtjs.org/)
- 🔖 [Release notes](./CHANGELOG.md)
- 👥 [Community](https://discord.nuxtjs.org/) (`#i18n` channel)


## Features
- Integration with [vue-i18n](https://kazupon.github.io/vue-i18n/)
- Automatic routes generation and custom paths
- Search Engine Optimization
- Lazy-loading of translation messages
- Redirection based on auto-detected language
- Different domain names for different languages

## Setup
```sh
yarn add @nuxtjs/i18n # yarn
npm i @nuxtjs/i18n # npm
```

## Basic usage
Firstly, you need to add `@nuxtjs/i18n` to your Nuxt config.

```javascript
// nuxt.config.js

{
  modules: [
    [
      '@nuxtjs/i18n',
      {
        locales: ['en', 'es'],
        defaultLocale: 'en',
        vueI18n: {
          fallbackLocale: 'en',
          messages: {
            en: {
              greeting: 'Hello world!'
            },
            es: {
              greeting: '¡Hola mundo!'
            }
          }
        }
      }
    ]
  ]
}
```

Then you can start using `@nuxtjs/i18n` in your Vue components!

```html
<template>
  <main>
    <h1>{{ $t('greeting') }}</h1>

    <nuxt-link
      v-if="$i18n.locale !== 'en'"
      :to="switchLocalePath('en')"
    >
      English
    </nuxt-link>

    <nuxt-link
      v-if="$i18n.locale !== 'es'"
      :to="switchLocalePath('es')"
    >
      Español
    </nuxt-link>
  </main>
</template>
```

If you would like to find out more about how to use `@nuxtjs/i18n`, [check out the docs](https://i18n.nuxtjs.org/)!

## Issues, questions & requests

If you have any questions or issues, check out the `#i18n` channel on [Discord server](https://discord.nuxtjs.org).

## License

[MIT License](./LICENSE) - Copyright (c) Nuxt Community

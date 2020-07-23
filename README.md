# nuxt-i18n

[![](https://david-dm.org/nuxt-community/i18n-module/status.svg?style=flat-square)](https://david-dm.org/nuxt-community/i18n-module)
[![](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
[![](https://img.shields.io/codecov/c/github/nuxt-community/i18n-module.svg?style=flat-square)](https://codecov.io/gh/nuxt-community/i18n-module)
[![](https://snyk.io/test/github/nuxt-community/i18n-module/badge.svg?style=flat-square)](https://snyk.io/test/github/nuxt-community/i18n-module)
[![](https://img.shields.io/npm/v/nuxt-i18n/latest.svg?style=flat-square)](https://npmjs.com/package/nuxt-i18n)
[![](https://img.shields.io/npm/dt/nuxt-i18n.svg?style=flat-square)](https://npmjs.com/package/nuxt-i18n)

> i18n for your Nuxt project

## Links
- [Documentation](https://i18n.nuxtjs.org/)
- [Release notes](./CHANGELOG.md)
- [Community](https://discord.nuxtjs.org/)


## Features
- Integration with [vue-i18n](https://kazupon.github.io/vue-i18n/)
- Automatic routes generation and custom paths
- Search Engine Optimization
- Lazy-loading of translations messages
- Redirection based on auto-detected language
- Different domain names for different languages
- Storing current locale and messages with [Vuex](https://vuex.vuejs.org/)

## Setup
```sh
yarn add nuxt-i18n # yarn
npm i nuxt-i18n # npm
```

## Basic usage
Firstly, you need to add `nuxt-i18n` to your Nuxt config.

```javascript
// nuxt.config.js

{
  modules: [
    [
      'nuxt-i18n',
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

Then you can start using `nuxt-i18n` in your Vue components!

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

If you would like to find out more about how to use `nuxt-i18n`, [check out the docs](https://i18n.nuxtjs.org/)!

## Contributing

All contributions are welcome! If you would like to make some changes, follow these steps:

- Fork the project and clone it in your existing Nuxt project:

```sh
cd my-nuxt-project
mkdir modules
git clone git@github.com:<username>/i18n-module.git modules/i18n-module # ssh
git clone https://github.com/<username>/i18n-module.git modules/i18n-module # https
```

- Edit your Nuxt config to use the local module:

```js
// nuxt.config.js

{
  modules: [
    ['./modules/i18n-module', {
      // options...
    }]
  ]
}
```

- Install the module's dependencies:

```sh
cd modules/i18n-module/
yarn # yarn
npm i # npm
```

- Create a new branch for your changes:

```sh
git checkout -b my-new-feature
```

- Code, code, code!
- Run ESLint and Jest

```sh
yarn lint && yarn test # yarn
npm run lint && npm test # npm
```

- Commit and push your changes
- Submit awesome PRs

### Documentation

- Fork and clone the project:

```sh
git clone git@github.com:<username>/i18n-module.git # ssh
git clone https://github.com/<username>/i18n-module.git # https
```

- Install the dependencies:

```sh
cd i18n-module
yarn # yarn
npm i # npm
```

- Create a new branch for your changes:

```sh
git checkout -b my-new-feature
```

- Start the docs server:

```sh
yarn docs:dev # yarn
npm run docs:dev # npm
```

- Write some doc by editing files in `docs/` directory

> If you're adding new pages, make sure you add them to the table of contents in `docs/.vuepress/config`

- Commit and push your changes
- Once you're done, submit that shiny PR!

## Issues, questions & requests

If you have any questions or issues, check out [Discord server](https://discord.nuxtjs.org).

## License

[MIT License](./LICENSE) - Copyright (c) Nuxt Community

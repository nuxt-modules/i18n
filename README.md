[![Nuxt i18n](./docs/public/cover.png)](https://i18n.nuxtjs.org)

[![](https://img.shields.io/npm/v/%40nuxtjs%2Fi18n/latest.svg?style=flat&label=npm&colorA=18181B)](https://npmjs.com/package/%40nuxtjs%2Fi18n)
[![](https://img.shields.io/npm/dm/%40nuxtjs%2Fi18n?style=flat&colorA=18181B&color=blue)](https://npmjs.com/package/%40nuxtjs%2Fi18n)
[![](https://snyk.io/test/github/nuxt-community/i18n-module/badge.svg?style=flat-square)](https://snyk.io/test/github/nuxt-modules/i18n)
<a href="https://volta.net/nuxt-modules/i18n?utm_source=nuxt_i18n_readme"><img src="https://user-images.githubusercontent.com/904724/209143798-32345f6c-3cf8-4e06-9659-f4ace4a6acde.svg" alt="Volta board"></a>

# Nuxt I18n

Internationalization (i18n) for Nuxt apps.

[📖 Read documentation](https://i18n.nuxtjs.org/)

## Features

- Integration with `vue-i18n`
- Route localization (static & dynamic)
- Lazy load translations
- SEO tag localization
- Layer support

## 🚀 Usage

### Install

1. Install the `@nuxtjs/i18n` module to your project

```sh
npx nuxi@latest module add i18n
```

2. Configure the module using the `i18n` key in `nuxt.config.ts`

```ts
{
  modules: [
    '@nuxtjs/i18n',
  ],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US' },
      { code: 'fr', language: 'fr-FR' }
    ],
    defaultLocale: 'en',
  }
}
```

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/bobbiegoede/static/main/sponsors.svg">
    <img src="https://raw.githubusercontent.com/bobbiegoede/static/main/sponsors.svg" />
  </a>
</p>

## 🔗 Links

- 🔖 [Release notes](./CHANGELOG.md)
- 👥 [Community](https://discord.nuxtjs.org/) (`🗨️❓ help` support forum)
- 📖 Documentation
  - [Version 10.x](https://next.i18n.nuxtjs.org/)
  - [Version 9.x](https://v9.i18n.nuxtjs.org/)
  - [Version 8.x](https://v9.i18n.nuxtjs.org/docs/v8)
  - [Version 7.x (Nuxt 2 - EOL)](https://v9.i18n.nuxtjs.org/docs/v7)

## ©️ License

[MIT License](./LICENSE) - Copyright (c) Nuxt Community

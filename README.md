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

## Edge Release Channel &nbsp; [![](https://img.shields.io/npm/v/%40nuxtjs%2Fi18n-edge/latest.svg?style=flat&label=npm&colorA=18181B&color=blue)](https://npmjs.com/package/%40nuxtjs%2Fi18n-edge)

Nuxt I18n lands commits, improvements and bug fixes every day, you can opt in to test these before their release using the edge release channel.

### Opting In

Update `@nuxtjs/i18n` dependency inside `package.json`:

```diff
{
  "devDependencies": {
--    "@nuxtjs/i18n": "^8.0.0"
++    "@nuxtjs/i18n": "npm:@nuxtjs/i18n-edge"
  }
}
```

Remove lockfile (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) and reinstall dependencies.

### Opting Out

Update `@nuxtjs/i18n` dependency inside `package.json`:

```diff
{
  "devDependencies": {
--    "@nuxtjs/i18n": "npm:@nuxtjs/i18n-edge"
++    "@nuxtjs/i18n": "^8.0.0"
  }
}
```

Remove lockfile (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) and reinstall dependencies.

## Nuxt 2

Since Nuxt 2 has reached [its end-of-life (EOL) date](https://v2.nuxt.com/lts/) we are not actively maintaining support for this version, the last version to support Nuxt 2 is `v7`.

The codebase for this version can be found on the [`v7` branch](https://github.com/nuxt-modules/i18n/tree/v7) and its documentation [here](https://i18n.nuxtjs.org/docs/v7).

## 🔗 Links

- 🔖 [Release notes](./CHANGELOG.md)
- 👥 [Community](https://discord.nuxtjs.org/) (`🗨️❓ help` support forum)

## ©️ License

[MIT License](./LICENSE) - Copyright (c) Nuxt Community

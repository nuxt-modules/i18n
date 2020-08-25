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

> Please make sure all languages are in sync. If you don't speak a particular language, put an english text in place of changed or added text.

- Commit and push your changes
- Once you're done, submit that shiny PR!

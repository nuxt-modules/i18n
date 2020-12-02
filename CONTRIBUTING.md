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
yarn
```

Note: This project is using `yarn`. You can use `npm` but make sure not to commit the `package-lock.json` when creating a PR.

- Create a new branch for your changes:

```sh
git checkout -b my-new-feature
```

- Code, code, code!
- Run ESLint and Jest

```sh
yarn lint && yarn test
```

You can also run just the specific test suite with those commands:

```sh
# Run the SSR tests
yarn test:e2e-ssr
# Run the browser tests
yarn test:e2e-browser
# Run the unit tests
yarn test:unit
# Run the TS types test
yarn test:types
```

You can also specific testsuites in "watch" mode which will re-run tests when you make changes, for example:

```sh
yarn test:e2e-ssr --watch
```

And you can even filter specific tests by name to speed up iteration times when working on particular part of the code:

```sh
yarn test:e2e-ssr -t 'detectBrowserLanguage'
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
yarn
```

- Create a new branch for your changes:

```sh
git checkout -b my-new-feature
```

- Start the docs server:

```sh
yarn docs:dev
```

- Write some doc by editing files in `docs/` directory

> Please make sure all languages are in sync. If you don't speak a particular language, insert english text in place.

- Commit and push your changes
- Once you're done, submit that shiny PR!

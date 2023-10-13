## Contributing

All contributions are welcome! If you would like to make some changes, follow these steps:

- Fork the project and clone it

```sh
cd my-projects
git clone git@github.com:nuxt-modules/i18n.git
```

- Install the module's dependencies:

```sh
cd i18n
pnpm i
```

Note: This project is using `pnpm`.

- Create a new branch for your changes:

```sh
git checkout -b my-new-feature
```

- Code, code, code!
- Run ESLint and Vitest

```sh
pnpm fix
pnpm test:unit
pnpm test:spec
```

- Commit and push your changes
- Submit awesome PRs

### Documentation

you can contribute for documentation

- Setup docs

```sh
pnpm docs:setup
```

- Start the docs server:

```sh
pnpm docs:dev
```

- Write some doc by editing files in `docs/` directory

> Please make sure all languages are in sync. If you don't speak a particular language, insert english text in place.

- Commit and push your changes
- Once you're done, submit that shiny PR!

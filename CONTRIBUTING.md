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

- Setup type generation

```sh
pnpm dev:prepare
```

- Create a new branch for your changes:

```sh
git checkout -b my-new-feature
```

- Code, code, code!
- Run ESLint and Vitest

```sh
pnpm lint # lint and format check
pnpm lint:fix  # auto fix for lint and format
pnpm test:unit # unit tests
pnpm test:e2e # e2e tests
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

## AI-Assisted Contributions

We welcome the thoughtful use of AI tools when contributing to Nuxt i18n, yet ask all contributors to follow [two core principles](https://roe.dev/blog/using-ai-in-open-source).

### Never let an LLM speak for you

- All comments, issues, and pull request descriptions should be written in your own voice
- We value clear, human communication over perfect grammar or spelling
- Avoid copy-pasting AI-generated summaries that don't reflect your own understanding

### Never let an LLM think for you

- Feel free to use AI tools to generate code or explore ideas
- Only submit contributions you fully understand and can explain
- Contributions should reflect your own reasoning and problem-solving

Contributions that look fully automated are labelled `possible bot`, and pull requests from accounts that look automated are closed. If we get that wrong, reopen the pull request or leave a comment and we'll take another look.

If you know a contribution is machine-generated, prefix its title with `🤖🤖🤖` so it is flagged up front.

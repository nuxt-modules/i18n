<h1 align="center">nuxt-i18n</h1>
<p align="center">i18n features for your Nuxt project</p>

<p align="center">
<a href="https://nuxt-community.github.io/nuxt-i18n/">Documentation</a> | <a href="./CHANGELOG.md">Release notes</a>
</p>


<p align="center">
<a href="https://david-dm.org/nuxt-community/nuxt-i18n">
    <img alt="" src="https://david-dm.org/nuxt-community/nuxt-i18n/status.svg?style=flat-square">
</a>
<a href="https://standardjs.com">
    <img alt="" src="https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square">
</a>
<a href="https://circleci.com/gh/nuxt-community/nuxt-i18n">
    <img alt="" src="https://img.shields.io/circleci/project/github/nuxt-community/nuxt-i18n.svg?style=flat-square">
</a>
<a href="https://codecov.io/gh/nuxt-community/nuxt-i18n">
    <img alt="" src="https://img.shields.io/codecov/c/github/nuxt-community/nuxt-i18n.svg?style=flat-square">
</a>
<a href="https://snyk.io/test/github/nuxt-community/nuxt-i18n"><img src="https://snyk.io/test/github/nuxt-community/nuxt-i18n/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/nuxt-community/nuxt-i18n" style="max-width:100%;"/></a>
<br>
<a href="https://npmjs.com/package/nuxt-i18n">
    <img alt="" src="https://img.shields.io/npm/v/nuxt-i18n/latest.svg?style=flat-square">
</a>
<a href="https://npmjs.com/package/nuxt-i18n">
    <img alt="" src="https://img.shields.io/npm/dt/nuxt-i18n.svg?style=flat-square">
</a>
</p>

<h2 align="center">Co-maintainers welcome!</h2>

I've been lacking time to properly maintain the project lately and I would be really happy if anyone were interested in helping me maintaining **nuxt-i18n**! It looks like there are more and more projects using this module and we've had great contributions from the community. It's just getting hard to keep track of the issues and questions here and on CMTY so don't hesitate to get in touch if you're interested in taking a bigger part in the project!

Feel free to email me at the address that's in [my profile](https://github.com/paulgv).

## Contribute to the module

- Fork the project and clone it in your existing Nuxt project:

```sh
cd my-nuxt-project/
mkdir modules/
git clone https://github.com/<username>/nuxt-i18n.git modules/nuxt-i18n
# or
git clone git@github.com:<username>/nuxt-i18n.git modules/nuxt-i18n
```

- Edit your Nuxt config to use the local module:

```js
// nuxt.config.js

{
  modules: [
    ['./modules/nuxt-i18n', {
      // options...
    }]
  ]
}
```

- Install the module's dependencies

```sh
cd modules/nuxt-i18n/
yarn
```

- Code, code, code!
- Run ESLint & Jest

```sh
yarn lint && yarn test
```

- Submit awesome PRs

## Contribute to the documentation

- Fork and clone the project

```sh
git clone git@github.com:<username>/nuxt-i18n.git
# or
git clone https://github.com/<username>/nuxt-i18n.git
```

- Install the dependencies

```sh
cd nuxt-i18n/
yarn
```

- Start the docs server

```sh
yarn docs:dev
```

- Write some doc by editing files in `docs/` directory, if you're adding new pages, make sure you add them to the table of contents in `docs/.vuepress/config`

- Once you're done, submit that shiny PR!

## Issues, questions & requests

Please use [CMTY](https://cmty.app/nuxt/nuxt-i18n/issues?type=question) for any question you might have.


## License

[MIT License](./LICENSE) - Copyright (c) Nuxt Community

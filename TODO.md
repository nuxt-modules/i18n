# TODO

- For Official release
  - [ ] remove `i18n:extends-messages` hook logic
  - [ ] remove `parsePage` option logic
  - [ ] update `@intlify/**` and vue-i18-\* pkgs for latest version
- Refactoring
  - [ ] module alias, langs option, etc should be resolved with `createResolver`
  - [ ] resolve i18n options of nuxt.config with `useRuntimeConfig`, not `i18n.options.mjs`
  - [ ] pass `vueI18n` option as config and pass it to vue-i18n in runtime context.
  - [ ] request nuxt sergment parser from `@nuxt/kit` API and use it.

# TODO

- For Official release
  - [x] remove `i18n:extends-messages` hook logic
  - [x] remove `parsePage` option logic
  - [x] update `@intlify/**` and vue-i18-\* pkgs for latest version
- Refactoring
  - [ ] module alias, langs option, etc should be resolved with `createResolver`
  - [ ] resolve i18n options of nuxt.config with `useRuntimeConfig`, not `i18n.options.mjs`
  - [ ] pass `vueI18n` option as config and pass it to vue-i18n in runtime context.
  - [ ] request nuxt segment parser from `@nuxt/kit` API and use it.

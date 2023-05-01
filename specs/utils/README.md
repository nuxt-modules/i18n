# test utils for e2e

This utils is fokred from [`@nuxt/test-uitls`](https://github.com/nuxt/nuxt/tree/main/packages/test-utils)

## Why?

The resolving of the `buildDir` is a bit special, un-like `nuxi cli`. It's further nested in `.nuxt` with a string of random values.

nuxt i18n module uses prerender and unstorage and depends on the path of the `buildDir`.


## ©️ License

[MIT](./LICENSE)

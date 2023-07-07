# test utils for e2e

This utils is fokred from [`@nuxt/test-uitls`](https://github.com/nuxt/nuxt/tree/main/packages/test-utils)

## 🤔 Why?

The resolving of the `buildDir` is a bit special, un-like `nuxi` CLI. It's further nested in `.nuxt` with a string of random values.

nuxt i18n module uses nitro prerender and unjs/unstorage, depends on the nuxt `buildDir` path structure regularly.

## 🔨 Rquirement for e2e fixture

When you need e2e test for some bug fixes and feauture, You need to **set up the fixture for your `.spec.ts`**.

## ©️ License

[MIT](./LICENSE)

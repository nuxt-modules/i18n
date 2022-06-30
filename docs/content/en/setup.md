---
title: Setup
description: ''
position: 2
category: Getting started
---

<alert type="info">

Check the [Nuxt.js documentation](https://nuxtjs.org/guides/configuration-glossary/configuration-modules) for more information about installing and using modules in Nuxt.js.

</alert>

Add `@nuxtjs/i18n` dependency to your project:

<code-group>
  <code-block label="Yarn" active>

  ```bash
  yarn add @nuxtjs/i18n
  ```

  </code-block>
  <code-block label="NPM">

  ```bash
  npm install @nuxtjs/i18n
  ```

  </code-block>
</code-group>

Then, add `@nuxtjs/i18n` to the `modules` section in your `nuxt.config.js`. You can use either of the following ways to specify the module options:

```js {}[nuxt.config.js]
{
  modules: [
    '@nuxtjs/i18n',
  ],
  i18n: {
    /* module options */
  },
}
```

or

```js {}[nuxt.config.js]
{
  modules: [
    [
      '@nuxtjs/i18n',
      { /* module options */ }
    ]
  ],
}
```

The former approach has the benefit of having type-checking enabled if you have followed the [Typescript setup](#typescript).

## Typescript

If using typescript or running typescript language server to check the code (for example through Vetur), add types to `types` array in your `tsconfig.json`:

```js {}[tsconfig.json]
{
  "compilerOptions": {
    "types": [
      "@nuxt/types",
      "@nuxtjs/i18n",
    ]
  }
}
```

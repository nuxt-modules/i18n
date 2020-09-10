---
title: Setup
description: ''
position: 2
category: Guide
---

<alert type="info">

Check the [Nuxt.js documentation](https://nuxtjs.org/guides/configuration-glossary/configuration-modules) for more information about installing and using modules in Nuxt.js.

</alert>

Add `nuxt-i18n` dependency to your project:

<code-group>
  <code-block label="Yarn" active>

  ```bash
  yarn add nuxt-i18n
  ```

  </code-block>
  <code-block label="NPM">

  ```bash
  npm install nuxt-i18n
  ```

  </code-block>
</code-group>

Then, add `nuxt-i18n` to the `modules` section of `nuxt.config.js`:

```js{}[nuxt.config.js]
{
  modules: [
    'nuxt-i18n',
    { /* module options */ }
  ],
  // Or with global options
  i18n: {}
}
```

## Typescript

If using typescript or running typescript language server to check the code (for example through Vetur), add types to `types` array in your `tsconfig.json`:

```js{}[tsconfig.json]
{
  "compilerOptions": {
    "types": [
      "@nuxt/types",
      "nuxt-i18n",
    ]
  }
}
```

---
title: Per-component translations
description: "enable vue-i18n-loader"
position: 13
category: Guide
---

If you'd like to define translations per-page or per-component you can take advantage of the [vue-i18n-loader](https://github.com/intlify/vue-i18n-loader). Simply set `vueI18nLoader` option to `true` and `@nuxtjs/i18n` will configure and enable the loader for you, including support for Yaml syntax in the `i18n` blocks.

```js {}[nuxt.config.js]
i18n: {
  vueI18nLoader: true
}
```

You can now define translations using custom blocks in your Vue files:

```vue
<i18n>
{
  "en": {
    "hello": "hello world!"
  },
  "ja": {
    "hello": "こんにちは、世界!"
  }
}
</i18n>

<template>
  <p>{{ $t('hello') }}</p>
</template>
```

or using the Yaml syntax:

```vue
<i18n lang="yaml">
en:
  hello: "hello world!"
ja:
  hello: "こんにちは、世界!"
</i18n>

<template>
 <p>{{ $t('hello') }}</p>
</template>
```

<alert type="info">

Read more about `i18n` blocks in https://kazupon.github.io/vue-i18n/guide/sfc.html.

</alert>

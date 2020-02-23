# vue-i18n-loader

If you'd like to enable [vue-i18n-loader](https://github.com/intlify/vue-i18n-loader), simply set `vueI18nLoader` option to `true`.

```js
// nuxt.config.js

['nuxt-i18n', {
  vueI18nLoader: true
}]

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

## YAML

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

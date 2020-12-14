---
title: vue-i18n-loader
description: 'vue-i18n-loader'
position: 13
category: Guía
---

Si desea habilitar [vue-i18n-loader](https://github.com/intlify/vue-i18n-loader), simplemente configure la opción `vueI18nLoader` en `true`.

```js {}[nuxt.config.js]
['nuxt-i18n', {
  vueI18nLoader: true
}]

```

Ahora puede definir traducciones utilizando bloques personalizados en sus archivos Vue:

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

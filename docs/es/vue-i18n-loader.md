# vue-i18n-loader

Si desea habilitar [vue-i18n-loader](https://github.com/kazupon/vue-i18n-loader), simplemente configure la opción `vueI18nLoader` en `true`.

```js
// nuxt.config.js

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
<i18n>
en:
  hello: "hello world!"
ja:
  hello: "こんにちは、世界!"
</i18n>

<template>
 <p>{{ $t('hello') }}</p>
</template>
```

Lo siguiente es necesario en el archivo de configuración nuxt para que funcionen los bloques YAML i18n:

```js
build: {
  extend(config) {
    config.module.rules.push({
      resourceQuery: /blockType=i18n/,
      type: "javascript/auto",
      loader: ["@kazupon/vue-i18n-loader", "yaml-loader"],
    });
  },
}
```

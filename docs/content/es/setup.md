---
title: Configuración
description: ''
position: 2
category: Guía
---

<alert type="info">

Consulte la [documentación de Nuxt.js]((https://nuxtjs.org/guides/configuration-glossary/configuration-modules)) para obtener más información sobre la instalación y el uso de módulos en Nuxt.js.

</alert>

Agregar `nuxt-i18n` a tus dependencias:

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

Then, add `nuxt-i18n` to the `modules` section of `nuxt.config.js`. You can use either of following ways to specify the module options:

```js {}[nuxt.config.js]
{
  modules: [
    'nuxt-i18n',
  ],
  i18n: {},
}
```

or

```js {}[nuxt.config.js]
{
  modules: [
    [
      'nuxt-i18n',
      { /* module options */ }
    ]
  ],
}
```

## Typescript

Si está utilizando typescript o ejecuta un servidor de lenguaje de typescript para verificar el código (por ejemplo, a través de Vetur), agregue tipos a la matriz `types` en su `tsconfig.json`:

```js {}[tsconfig.json]
{
  "compilerOptions": {
    "types": [
      "@nuxt/types",
      "nuxt-i18n",
    ]
  }
}
```

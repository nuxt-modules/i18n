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

Luego añadir `nuxt-i18n` a la `modules` seccíon de `nuxt.config.js`:

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

Si está utilizando typescript o ejecuta un servidor de lenguaje de typescript para verificar el código (por ejemplo, a través de Vetur), agregue tipos a la matriz `types` en su `tsconfig.json`:

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

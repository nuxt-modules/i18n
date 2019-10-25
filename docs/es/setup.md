# Configuración

Agregar **nuxt-i18n** a tus dependencias usando Yarn:

```bash
yarn add nuxt-i18n
```

O NPM:

```bash
npm i nuxt-i18n
```

Luego agregue el módulo en `nuxt.config.js`:

```js
{
  modules: [
    [
      'nuxt-i18n',
       { /* module options */ }
    ]
  ],

  // Or with global options
  i18n: {}
}
```

Si está utilizando typescript o ejecuta un servidor de lenguaje de typescript para verificar el código (por ejemplo, a través de Vetur), agregue tipos a la matriz `types` en su `tsconfig.json`:

```js
{
  "compilerOptions": {
    "types": [
      "nuxt-i18n"
    ]
}
```

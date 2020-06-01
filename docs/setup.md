# Setup

Add **nuxt-i18n** to your dependencies using Yarn:

```bash
yarn add nuxt-i18n
```

Or NPM:

```bash
npm i nuxt-i18n
```

Then add the module to `nuxt.config.js`:

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

If using typescript or running typescript language server to check the code (for example through Vetur), add types to `types` array in your `tsconfig.json`:

```js
{
  "compilerOptions": {
    "types": [
      "nuxt-i18n"
    ]
  }
}
```

# Lazy-load translations

To prevent loading all translations at once, messages can be loaded asynchronously when a user loads the app or switches to another language. This can be done by setting option `loadLanguagesAsync` to `true` and by referencing your translations files in the `locales` option. Additionally, you might want to set the langDir option to match your files structure \(defaults to **lang/**\).

Say your files are organized this way:

```
nuxt/
├── lang/
│   ├── en-US.js
│   ├── es-ES.js
│   ├── fr-FR.js
├── nuxt.config.js
```

Your config could then reflect this files structure to let the module load messages from your translations files:

```js
{
  ['nuxt-i18n', {
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        langFile: 'en-US.js'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        langFile: 'fr-FR.js'
      },
      {
        code: 'es',
        iso: 'es-ES',
        name: 'Español',
        langFile: 'es-ES.js'
      }
    ],
    loadLanguagesAsync: true,
    langDir: 'lang/'
  }],
}
```




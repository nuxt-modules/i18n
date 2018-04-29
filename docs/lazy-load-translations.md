# Lazy-load translations

For app's that contain a lot of translated content, it is preferable not to bundle all the messages in the main bundle but rather lazy-load only the language that the users selected.
This can be achieved with **i18n-module** by letting the module know where your translation files are located so it can dynamically import them when the app loads or when the user switches to another language.
To enable translations lazy-loading, follow these 4 steps when configuring **i18n-module**:

* Set `lazy` option to `true`
* Set `langDir` option to the directory that contains your translation files (this can NOT be empty)
* Configure `locales` option as an array of object, where each object has a `file` key which value is the translation file corresponding to the locale
* Optionnaly, remove all messages that you might have passed to vue-i18n via `vueI18n` option


Example files structure:

```
nuxt-project/
├── lang/
│   ├── en-US.js
│   ├── es-ES.js
│   ├── fr-FR.js
├── nuxt.config.js
```

Configuration example:

```js
// nuxt.config.js

['@nuxtjs/i18n', {
  locales: [
    {
      code: 'en',
      langFile: 'en-US.js'
    },
    {
      code: 'es',
      langFile: 'es-ES.js'
    },
    {
      code: 'fr',
      langFile: 'fr-FR.js'
    }
  ],
  lazy: true,
  langDir: 'lang/'
}]
```

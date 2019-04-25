# Lazy-load translations

For app's that contain a lot of translated content, it is preferable not to bundle all the messages in the main bundle but rather lazy-load only the language that the users selected.
This can be achieved with **nuxt-i18n** by letting the module know where your translation files are located so it can dynamically import them when the app loads or when the user switches to another language.
To enable translations lazy-loading, follow these 4 steps when configuring **nuxt-i18n**:

* Set `lazy` option to `true`
* Set `langDir` option to the directory that contains your translation files (this can NOT be empty)
* Configure `locales` option as an array of object, where each object has a `file` key which value is the translation file corresponding to the locale
* Optionnaly, remove all messages that you might have passed to vue-i18n via `vueI18n` option
* Each `file` can return either an `Object` or a `function` (Supports `Promises`)

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

['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      file: 'en-US.js'
    },
    {
      code: 'es',
      file: 'es-ES.js'
    },
    {
      code: 'fr',
      file: 'fr-FR.js'
    }
  ],
  lazy: true,
  langDir: 'lang/'
}]
```

Language file example:

```js
// lang/[lang].js

export default (context) => {
  return new Promise(function (resolve) {
    resolve({
      welcome: 'Welcome'
    })
  });
}
// or
export default {
  welcome: 'Welcome'
}
```

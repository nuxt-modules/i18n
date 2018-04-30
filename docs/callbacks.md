# Callbacks

**nuxt-i18n** exposes some callbacks that you can use to perform specific tasks that depend on the app's language.

### `beforeLanguageSwitch(oldLocale, newLocale)`

Called right before setting the app's new locale.

Parameters:

* **oldLocale**: the app's locale before the switch
* **newLocale**: the app's locale after the switch

### `onLanguageSwitched(oldLocale, newLocale)`

Called right after the app's locale has been switched.

Parameters:

* **oldLocale**: the app's locale before the switch
* **newLocale**: the app's locale after the switch



## Usage

A typical usage would be to define those callbacks via a plugin where you can access the app's context \(useful if you need to change Axios' config when the language changes for example\).

```js
// ~/plugins/i18n.js

export default function ({ app }) {
  // beforeLanguageSwitch called right before setting a new locale
  app.i18n.beforeLanguageSwitch = (oldLocale, newLocale) => {
    console.log(oldLocale, newLocale)
  }
  // onLanguageSwitched called right after a new locale has been set
  app.i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    console.log(oldLocale, newLocale)
  }
}
```

Add the plugin to Nuxt's config:

```js
// nuxt.config.js

module.exports = {
  plugins: [
    { src: '~plugins/i18n.js' }
  ]
}
```




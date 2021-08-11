---
title: Callbacks
description: "**@nuxtjs/i18n** exposes some callbacks that you can use to perform specific tasks that depend on the app's language."
position: 5
category: Guide
---

**@nuxtjs/i18n** exposes some callbacks that you can use to perform specific tasks that depend on the app's language.

### onBeforeLanguageSwitch

Called before the app's locale is switched. Can be used to override the new locale by returning a new locale code.

Parameters:

* **oldLocale**: the app's locale before the switch
* **newLocale**: the app's locale after the switch
* **isInitialSetup**: set to `true` if it's the initial locale switch that triggers on app load. It's a special case since the locale is not technically set yet so we're switching from no locale to locale.
* **context**: the Nuxt Context

Returns: `string` or nothing

### onLanguageSwitched

Called right after the app's locale has been switched.

Parameters:

* **oldLocale**: the app's locale before the switch
* **newLocale**: the app's locale after the switch

## Usage

A typical usage would be to define those callbacks via a plugin where you can access the app's context \(useful if you need to change Axios' config when the language changes for example\).

```js {}[/plugins/i18n.js]
export default function ({ app }) {
  // onBeforeLanguageSwitch called right before setting a new locale
  app.i18n.onBeforeLanguageSwitch = (oldLocale, newLocale, isInitialSetup, context) => {
    console.log(oldLocale, newLocale, isInitialSetup)
  }
  // onLanguageSwitched called right after a new locale has been set
  app.i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    console.log(oldLocale, newLocale)
  }
}
```

Add the plugin to Nuxt's config:

```js {}[nuxt.config.js]
module.exports = {
  plugins: [
    { src: '~/plugins/i18n.js' }
  ]
}
```

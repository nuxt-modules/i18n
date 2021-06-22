---
title: Callbacks
description: '**nuxt-i18n** expone algunas devoluciones de llamada que puede usar para realizar tareas específicas que dependen del idioma de la aplicación.'
position: 5
category: Guía
---

**nuxt-i18n** expone algunas devoluciones de llamada que puede usar para realizar tareas específicas que dependen del idioma de la aplicación.

### `onBeforeLanguageSwitch(oldLocale, newLocale, isInitialSetup, context)`

<badge>v6.27.0+</badge>

Called before the app's locale is switched. Can be used to override the new locale by returning a new locale code.

Parameters:

* **oldLocale**: the app's locale before the switch
* **newLocale**: the app's locale after the switch
* **isInitialSetup**: set to `true` if it's the initial locale switch that triggers on app load. It's a special case since the locale is not technically set yet so we're switching from no locale to locale.
* **context**: the Nuxt Context

Returns: `string` or nothing

### `onLanguageSwitched(oldLocale, newLocale)`

Llamado justo después de cambiar la configuración local de la aplicación.

Parámetros:

* **oldLocale**: la configuración local de la aplicación antes del cambio
* **newLocale**: la configuración local de la aplicación después del cambio

## Uso

 Un uso típico sería definir esas devoluciones de llamada a través de un complemento donde puede acceder al contexto de la aplicación \(útil si necesita cambiar la configuración de Axios cuando el idioma cambia, por ejemplo\).

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

Agregue el plugin a la configuración de Nuxt:

```js {}[nuxt.config.js]
module.exports = {
  plugins: [
    { src: '~/plugins/i18n.js' }
  ]
}
```

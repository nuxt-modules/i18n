# Callbacks

**nuxt-i18n** expone algunas devoluciones de llamada que puede usar para realizar tareas específicas que dependen del idioma de la aplicación.

### `beforeLanguageSwitch(oldLocale, newLocale)`

Llamado justo antes de configurar la nueva configuración local de la aplicación.

Parámetros:

* **oldLocale**: la configuración local de la aplicación antes del cambio
* **newLocale**: la configuración local de la aplicación después del cambio

### `onLanguageSwitched(oldLocale, newLocale)`

Llamado justo después de cambiar la configuración local de la aplicación.

Parámetros:

* **oldLocale**: la configuración local de la aplicación antes del cambio
* **newLocale**: la configuración local de la aplicación después del cambio



## Uso

 Un uso típico sería definir esas devoluciones de llamada a través de un complemento donde puede acceder al contexto de la aplicación \(útil si necesita cambiar la configuración de Axios cuando el idioma cambia, por ejemplo\).

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

Agregue el plugin a la configuración de Nuxt:

```js
// nuxt.config.js

module.exports = {
  plugins: [
    { src: '~/plugins/i18n.js' }
  ]
}
```




# Runtime Hooks

Nuxt i18n module exposes some [runtime hooks](https://nuxt.com/docs/guide/going-further/hooks#app-hooks-runtime) as callbacks that you can use to perform specific tasks that depend on the app's language.

::: warning
For v8.0.0-beta.10 and below, please refer to [callbacks](https://i18n.nuxtjs.org/callbacks/) and [configuration](https://i18n.nuxtjs.org/options-reference#onbeforelanguageswitch).
:::

---

**Nuxt i18n module** exposes some callbacks that you can use to perform specific tasks that depend on the app's language.

### `i18n:beforeLocaleSwitch`

Called before the app's locale is switched. Can be used to override the new locale by returning a new locale code.

Parameters:

- **oldLocale**: the app's locale before the switch
- **newLocale**: the app's locale after the switch
- **initialSetup**: set to `true` if it's the initial locale switch that triggers on app load. It's a special case since the locale is not technically set yet so we're switching from no locale to locale.
- **context**: the Nuxt app

Returns: `string` or nothing

### `i18n:localeSwitched`

Called right after the app's locale has been switched.

Parameters:

- **oldLocale**: the app's locale before the switch
- **newLocale**: the app's locale after the switch

## Usage

A typical usage would be to define those callbacks via a plugin where you can access the app's context \(useful if you need to change Axios' config when the language changes for example\).

:::code-group
```js {}[/plugins/i18n.js]
export default defineNuxtPlugin(nuxtApp => {
  // called right before setting a new locale
  nuxtApp.hook('i18n:beforeLocaleSwitch', ({ oldLocale, newLocale, initialSetup, context }) => {
    console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initialSetup)
  })

  // called right after a new locale has been set
  nuxtApp.hook('i18n:localeSwitched', ({ oldLocale, newLocale }) => {
    console.log('onLanguageSwitched', oldLocale, newLocale)
  })
})
```
:::

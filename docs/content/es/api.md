---
title: Referencia API
description: 'Referencia API'
position: 30
category: API
---

## Extensión de Vue

<alert type="info">

Todos los [Vue I18n propiedades y métodos](http://kazupon.github.io/vue-i18n/api/#vue-injected-methods) (como `$t`, `$i18n`, directiva `v-t` y otros) también están disponibles, aunque no se enumeran aquí. A continuación, estan solamente los agregados por `nuxt-i18n`.

</alert>

### Métodos

#### localePath

  - **Arguments**:
    - route (type: `string` | [`Location`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125))
    - locale (type: `string`, default: current locale)
  - **Returns**: `string`

  Returns localized path for passed in `route`. If `locale` is not specified, uses current locale.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

#### switchLocalePath

  - **Arguments**:
    - locale: (type: `string`)
  - **Returns**: `string`

  Returns path of the current route for specified `locale`.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

  See type definition for [Location](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125).

#### getRouteBaseName

  - **Arguments**:
    - route (type: `string` | [`Location`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125), default: current route)
  - **Returns**: `string`

  Returns base name of current (if argument not provided) or passed in `route`. Base name is name of the route without locale suffix and other metadata added by `nuxt-i18n`.

#### localeRoute

<badge>v6.12.0+</badge>

  - **Arguments**:
    - route (type: `RawLocation`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L8))
    - locale (type: `string`, default: current locale)
  - **Returns**: [`Route`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L135-L145) | `undefined`

  Returns localized route for passed in `route` parameters. If `locale` is not specified, uses current locale.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

#### localeLocation

<badge>v6.24.0+</badge>

  - **Arguments**:
    - route (type: `RawLocation`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L8))
    - locale (type: `string`, default: current locale)
  - **Returns**: [`Location`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125-L133) | `undefined`

  Returns localized location for passed in `route` parameters. If `locale` is not specified, uses current locale.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

#### $nuxtI18nHead

<badge>v6.19.0+</badge>

  - **Arguments**:
    - options: (type: [`NuxtI18nHeadOptions`](https://github.com/nuxt-community/i18n-module/blob/master/types/nuxt-i18n.d.ts))
  - **Returns**: [`MetaInfo`](https://github.com/nuxt/vue-meta/blob/74182e388ad1b1977cb7217b0ade729321761403/types/vue-meta.d.ts#L173)

  If `options.addDirAttribute` is set to `false`, the `dir` attribute will not be added.
  If `options.addSeoAttributes` is set to `true`, the seo attributes will be added.

#### $nuxtI18nSeo

<badge>deprecated from v6.19.0 (use `$nuxtI18nHead`)</badge>

  - **Arguments**:
    - no arguments
  - **Returns**: [`MetaInfo`](https://github.com/nuxt/vue-meta/blob/74182e388ad1b1977cb7217b0ade729321761403/types/vue-meta.d.ts#L173)

  SEO object provided mostly for use with [SEO - Improving Performance](../seo#improving-performance).

## Extension of VueI18n

<alert type="info">

Instance of [VueI18n class](http://kazupon.github.io/vue-i18n/api/#vuei18n-class) (see its [properties and methods](http://kazupon.github.io/vue-i18n/api/#properties)) is exposed as `$i18n` on Vue instance and Vuex Store but as `i18n` on Nuxt `context.app`.

</alert>

### Methods

#### getLocaleCookie

  - **Arguments**:
    - no arguments
  - **Returns**: `string | undefined`

  Returns locale code from stored locale cookie.

#### setLocaleCookie

  - **Arguments**:
    - locale (type: `string`)
  - **Returns**: `undefined`

  Updates stored locale cookie with specified locale code. Consider using `setLocale` instead if you want to switch locale.

#### setLocale

<badge>v6.1.0+</badge>

  - **Arguments**:
    - locale (type: `string`)
  - **Returns**: `Promise<undefined>`

  Switches locale of the app to specified locale code. If `useCookie` option is enabled, locale cookie will be updated with new value. If prefixes are enabled (`strategy` other than `no_prefix`), will navigate to new locale's route.

#### getBrowserLocale

  - **Parámetros**:
    - sin parámetros
  - **Devuelve**: `string | undefined`

  Devuelve el código del idioma que utiliza el navegador, filtrado según los códigos definidos en las opciones.

#### finalizePendingLocaleChange

<badge>v6.20.0+</badge>

  - **Arguments**:
    - no arguments
  - **Returns**: `Promise<undefined>`

  Switches to the pending locale that would have been set on navigate, but was prevented by the option [`skipSettingLocaleOnNavigate`](./options-reference#skipsettinglocaleonnavigate). See more information in [Wait for page transition](./lang-switcher#wait-for-page-transition).

#### waitForPendingLocaleChange

<badge>v6.20.0+</badge>

  - **Arguments**:
    - no arguments
  - **Returns**: `Promise<undefined>`

  Returns a promise that will be resolved once the pending locale is set.

### Properties

#### defaultDirection

<badge>v6.19.0+</badge>

  - **Type**: `Directions`

  Default direction as specified in options.

#### defaultLocale

  - **Type**: `string`

  Default locale as specified in options.

#### localeCodes

  - **Type**: `Array<string>`

  List of locale codes of registered locales.

#### locales

  - **Type**: `Array<string | LocaleObject>`

  List of locales as defined in options.

#### localeProperties

  - **Type**: `LocaleObject`

  Object of the current locale properties.

#### differentDomains

  - **Type**: `boolean`

  Whether `differentDomains` option is enabled.

#### onBeforeLanguageSwitch

  - **Type**: `Function`

  See [callbacks](../callbacks)

#### onLanguageSwitched

  - **Type**: `Function`

  See [callbacks](../callbacks)

## Extension of Nuxt Context

The following APIs are exposed both on `context` and `context.app`.

### i18n

  - **Type**: [`VueI18n`](#extension-of-vuei18n)

See also [Nuxt context](https://nuxtjs.org/guides/concepts/context-helpers).

Can be accessed from `asyncData` and wherever `context` is available.

Example use:

```js
export default Vue.extend({
  asyncData({ i18n }) {
    const locale = i18n.locale

    return {
      locale
    }
  }
})
````

### getRouteBaseName
### localePath
### localeRoute
### localeLocation
### switchLocalePath

See more info about those in [methods documentation](#methods).

## Extension of Vuex

### $i18n

  - **Type**: [`VueI18n`](#extension-of-vuei18n)

Can be accessed in store's actions and mutations as `this.$i18n`.

Example use:

```js
export const actions = {
  nuxtServerInit({ commit }) {
    commit('LOCALE', this.$i18n.locale)
  }
}
````

### getRouteBaseName
### localePath
### localeRoute
### localeLocation
### switchLocalePath

See more info about those in [methods documentation](#methods).

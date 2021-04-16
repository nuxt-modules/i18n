---
title: Carga diferida de traducciones
description: 'Carga diferida de traducciones'
position: 9
category: Guía
---

Para las aplicaciones que contienen una gran cantidad de contenido traducido, es preferible no agrupar todos los mensajes en el paquete principal, sino cargar de manera diferida solo el idioma que seleccionaron los usuarios.
Esto se puede lograr con **nuxt-i18n** al permitir que el módulo sepa dónde se encuentran sus archivos de traducción para que pueda importarlos dinámicamente cuando se carga la aplicación o cuando el usuario cambia a otro idioma.
Para habilitar la carga diferida de traducciones, siga estos pasos cuando configure **nuxt-i18n**:

* Set `lazy` option to `true` (or to an object if you want to customize some options). [Read more](#lazy-configuration-options).
* Establezca la opción `langDir` en el directorio (esto NO puede estar vacío) que contiene sus archivos de traducción.
* Configure la opción `locales` como una matriz de objetos, donde cada objeto tiene una clave `file` cuyo valor es el archivo de traducción correspondiente a la configuración local
* Opcionalmente, elimine todos los mensajes que haya pasado a vue-i18n mediante la opción `vueI18n`
* Cada `file` puede devolver un `Object` o una `function` (admite `Promises`)

Estructura de archivos de ejemplo:

```
nuxt-project/
├── lang/
│   ├── en-US.js
│   ├── es-ES.js
│   ├── fr-FR.js
├── nuxt.config.js
```

Ejemplo de configuración:

```js {}[nuxt.config.js]
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
  langDir: 'lang/',
  defaultLocale: 'en'
}]
```

Ejemplo de archivo de idioma:

```js {}[lang/en-US.js]
export default async (context, locale) => {
  return await Promise.resolve({
    welcome: 'Welcome'
  })
}

// or

export default {
  welcome: 'Welcome'
}
```

<alert type="info">

Note that if you want to use the `$axios` instance from the `@nuxtjs/axios` module within the exported function, the `@nuxtjs/axios` module must be registered **after** the `nuxt-i18n` module.

This rule in fact applies also to any other module that adds plugins and whose functionality you'd want to use from within that function.

</alert>

## Lazy configuration options

<badge>v6.3.0+</badge>

The `lazy` option can be assigned a configuration object to customize the lazy-loading behavior.

The supported configuration options are:

### `skipNuxtState`

By default, the locale messages for the currently selected locale (unless it happens to be the `fallbackLocale`) are injected into the Nuxt "state" on the server-side and re-used on the client-side. The benefit of that is that the messages are available synchronously on the client-side and an extra network request is avoided. The downside is that it makes each page server response bigger (especially if there is a lot of messages). This applies both to the server-side rendered and statically-generated sites.

With `skipNuxtState` enabled, the locale messages are loaded from respective javascript bundles (for fallback locale from the main bundle and for other locales from their own bundles). This allows the payload to be smaller, but means that the page load might be slower due to an extra request (although browser-side caching will help as much as possible).

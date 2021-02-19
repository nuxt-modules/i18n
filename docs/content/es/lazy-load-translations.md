---
title: Carga diferida de traducciones
description: 'Carga diferida de traducciones'
position: 9
category: Guía
---

Para las aplicaciones que contienen una gran cantidad de contenido traducido, es preferible no agrupar todos los mensajes en el paquete principal, sino cargar de manera diferida solo el idioma que seleccionaron los usuarios.
Esto se puede lograr con **nuxt-i18n** al permitir que el módulo sepa dónde se encuentran sus archivos de traducción para que pueda importarlos dinámicamente cuando se carga la aplicación o cuando el usuario cambia a otro idioma.
Para habilitar la carga diferida de traducciones, siga estos 4 pasos cuando configure **nuxt-i18n**:

* Establezca la opción `lazy` en `true`
* Establezca la opción `langDir` en el directorio (esto NO puede estar vacío) que contiene sus archivos de traducción. Only `*.js`, `*.ts` and `*.json` files will be loaded.
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

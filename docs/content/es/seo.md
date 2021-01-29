---
title: Optimización para motores de búsqueda
description: 'Optimización para motores de búsqueda'
position: 8
category: Guía
---

<alert type="info">

Using `seo` option (or alternatively the `$nuxtI18nSeo`-based solution - see [Improving Performance](#improving-performance)) requires that locales are configured as an array of objects and not strings.

</alert>

## Benefits

When the `seo` option is enabled, **nuxt-i18n** attempts to add some metadata to improve your pages SEO. Here's what it does.

### `lang` attribute for `<html>` tag

  Sets the correct `lang` attribute, equivalent to the current locale's ISO code, in the `<html>` tag.

### Automatic hreflang generation

  Generates `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. The language's ISO codes are used as `hreflang` values.

  Since version [v6.6.0](https://github.com/nuxt-community/i18n-module/releases/tag/v6.6.0), a catchall locale hreflang link is provided for each language group (e.g. `en-*`) as well. By default, it is the first language provided but another language can be selected by setting `isCatchallLocale` to `true` on that specific language object in your `nuxt.config.js`. [More on hreflang](https://support.google.com/webmasters/answer/189077)

An example without selected catchall locale:

```js {}[nuxt.config.js]
['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      iso: 'en-US' // Will be used as catchall locale by default
    },
    {
      code: 'gb',
      iso: 'en-GB'
    }
  ]
}]
```

Here is how you'd use `isCatchallLocale` to selected another language:

```js {}[nuxt.config.js]
['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      iso: 'en-US'
    },
    {
      code: 'gb',
      iso: 'en-GB',
      isCatchallLocale: true // This one will be used as catchall locale
    }
  ]
}]
```

  In case you already have an `en` language iso set, it'll be used as the catchall without doing anything

```js {}[nuxt.config.js]
['nuxt-i18n', {
  locales: [
    {
      code: 'gb',
      iso: 'en-GB'
    },
    {
      code: 'en',
      iso: 'en' // will be used as catchall locale
    }
  ]
}]
```

### OpenGraph Locale tag generation

Generates `og:locale` and `og:locale:alternate` meta tags as defined in the [Open Graph protocol](http://ogp.me/#optional).

### Canonical link generation

Generates `rel="canonical"` link on all pages to specify the "main" version of the page that should be indexed by search engines. This is beneficial in various situations:
  - When using the `prefix_and_default` strategy there are technically two sets of pages generated for the default locale -- one prefixed and one unprefixed. The canonical link will be set to the unprefixed version of the page to avoid duplicate indexation.
  - When the page contains the query parameters, the canonical link will **not include** query params. This is typically the right thing to do as various query params can be inserted by trackers and should not be part of the canonical link. Note that there is currently no way to override that in case that including a specific query params would be desired.

[More on canonical](https://support.google.com/webmasters/answer/182192#dup-content)

## Requirements

Para que esta característica funcione, debe configurar la opción `locales` como una matriz de objetos, donde cada objeto tiene una opción `iso` establecida en el código ISO del idioma:

```js {}[nuxt.config.js]
['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      iso: 'en-US'
    },
    {
      code: 'es',
      iso: 'es-ES'
    },
    {
      code: 'fr',
      iso: 'fr-FR'
    }
  ]
}]
```

También debe establecer la opción  `baseUrl` en su dominio de producción para que las URL alternativas sean totalmente calificadas:

```js {}[nuxt.config.js]
['nuxt-i18n', {
  baseUrl: 'https://my-nuxt-app.com'
}]
```

`baseUrl` can also be set to a function that will be passed a [Nuxt Context](https://nuxtjs.org/guides/concepts/context-helpers) as a parameter and returns a string. It can be useful to make base URL dynamic based on request headers or `window.location`.

Para habilitar esta función en todas partes en su aplicación, configure la opción `seo` en `true`:

```js {}[nuxt.config.js]
['nuxt-i18n', {
  seo: true
}]
```

Si desea deshabilitar el SEO en páginas específicas, configure `i18n.seo` en `false` justo en la página:

```js {}[pages/about.vue]
export default {
  nuxtI18n: {
    seo: false
  }
}
```

Para anular los metadatos de SEO para cualquier página, simplemente declare su propio método `head ()`. Echa un vistazo a [src/templates/meta-head.js](https://github.com/nuxt-community/i18n-module/blob/master/src/templates/meta-head.js) si quieres copie parte de la lógica de  **nuxt-i18n**.

## Mejora del rendimiento

El método predeterminado para inyectar metadatos de SEO, aunque conveniente, tiene un costo de rendimiento.
El método `head` se registra para cada componente de su aplicación.
Esto significa que cada vez que se crea un componente, los metadatos de SEO se vuelven a calcular para cada componente.

Para mejorar el rendimiento, puede utilizar el método `$nuxtI18nSeo` en su diseño. Generará metadatos de SEO i18n para el contexto actual.

Primero, asegúrese de que el SEO automático esté desactivado estableciendo `seo` en `false` en su configuración o eliminando esa opción por completo:

```js {}[nuxt.config.js]
['nuxt-i18n', {
  seo: false
}]
```

Luego, en el diseño de su aplicación, declare el [`head` hook](https://nuxtjs.org/guides/features/meta-tags-seo) y use `$nuxtI18nSeo` dentro para generar la metainformación i18n SEO:

```js {}[layouts/default.vue]
export default {
  head () {
    return this.$nuxtI18nSeo()
  }
}
```

Si tiene más diseños, no olvide agregarlo allí también.

¡Eso es! Ahora los metadatos de SEO solo se computarán para el diseño en lugar de cada componente de su aplicación

### Combinando metadatos de SEO i18n con los tuyos

Si desea agregar su propio meta en el diseño, puede combinar fácilmente el objeto devuelto por `$nuxtI18nSeo` con el suyo:

```js {}[layouts/default.vue]
export default {
  head () {
    const i18nSeo = this.$nuxtI18nSeo()
    return {
      htmlAttrs: {
        myAttribute: 'My Value',
        ...i18nSeo.htmlAttrs
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'My Custom Description'
        },
        ...i18nSeo.meta
      ],
      link: [
        {
          hid: 'apple-touch-icon',
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png'
        },
        ...i18nSeo.link
     ]
    }
  }
}
```

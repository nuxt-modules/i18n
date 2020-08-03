# Optimización para motores de búsqueda

::: tip NOTE
Using `seo` option (or alternatively the `$nuxtI18nSeo`-based solution - see [Improving Performance](#improving-performance)) requires that locales are configured as an array of objects and not strings.
:::

Con la opción `seo`  habilitada, **nuxt-i18n** intenta agregar algunos metadatos para mejorar sus páginas SEO. Esto es lo que hace:

* Agregue un atributo _lang_ que contenga el código ISO del entorno local actual a la etiqueta  `<html>`.
* Genere etiquetas `<link rel="alternate" hreflang="x">` para cada idioma configurado en `nuxt.config.js`. Para cada idioma, el código ISO se usa como valor del atributo `hreflang`. [Más sobre hreflang](https://support.google.com/webmasters/answer/189077)
* Genere metaetiquetas `og:locale` y `og:locale:alternate` como se define en el [protocolo Open Graph](http://ogp.me/#optional)
* Cuando utilice la estrategia `prefix_and_default`, genere el enlace `rel="canonical"` en las rutas de idioma predeterminadas que contienen
prefijo para evitar la indexación duplicada. [Más sobre canonical](https://support.google.com/webmasters/answer/182192#dup-content)

Para que esta característica funcione, debe configurar la opción `locales` como una matriz de objetos, donde cada objeto tiene una opción `iso` establecida en el código ISO del idioma:

```js
// nuxt.config.js

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

```js
// nuxt.config.js

['nuxt-i18n', {
  baseUrl: 'https://my-nuxt-app.com'
}]
```

`baseUrl` can also be set to a function that will be passed a [Nuxt Context](https://nuxtjs.org/api/context) as a parameter and returns a string. It can be useful to make base URL dynamic based on request headers or `window.location`.

Para habilitar esta función en todas partes en su aplicación, configure la opción `seo` en `true`:

```js
// nuxt.config.js

['nuxt-i18n', {
  seo: true
}]
```

Si desea deshabilitar el SEO en páginas específicas, configure `i18n.seo` en `false` justo en la página:

```js
// pages/about.vue

export default {
  nuxtI18n: {
    seo: false
  }
}
```

Para anular los metadatos de SEO para cualquier página, simplemente declare su propio método `head ()`. Echa un vistazo a [src/templates/seo-head.js](https://github.com/nuxt-community/i18n-module/blob/master/src/templates/seo-head.js) si quieres copie parte de la lógica de  **nuxt-i18n**.

## Mejora del rendimiento

El método predeterminado para inyectar metadatos de SEO, aunque conveniente, tiene un costo de rendimiento.
El método `head` se registra para cada componente de su aplicación.
Esto significa que cada vez que se crea un componente, los metadatos de SEO se vuelven a calcular para cada componente.

Para mejorar el rendimiento, puede utilizar el método `$nuxtI18nSeo` en su diseño. Generará metadatos de SEO i18n para el contexto actual.

Primero, asegúrese de que el SEO automático esté desactivado estableciendo `seo` en `false` en su configuración o eliminando esa opción por completo:

```js
// nuxt.config.js

['nuxt-i18n', {
  seo: false
}]
```

Luego, en el diseño de su aplicación, declare el [`head` hook](https://nuxtjs.org/api/pages-head#the-head-method) y use `$nuxtI18nSeo` dentro para generar la metainformación i18n SEO:

```js
// layouts/default.vue

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

```js
// layouts/default.vue

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

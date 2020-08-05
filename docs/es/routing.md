# Enrutamiento

**nuxt-i18n** anula las rutas predeterminadas de Nuxt para agregar prefijos de configuración local a cada URL (excepto en la estrategia no_prefix). Digamos que su aplicación admite dos idiomas: francés e inglés como idioma predeterminado, y tiene las siguientes páginas en su proyecto:

```asciidoc
pages/
├── index.vue
├── about.vue
```

Esto daría como resultado que se generen las siguientes rutas

```js
[
  {
    path: "/",
    component: _3237362a,
    name: "index___en"
  },
  {
    path: "/fr/",
    component: _3237362a,
    name: "index___fr"
  },
  {
    path: "/about",
    component: _71a6ebb4,
    name: "about___en"
  },
  {
    path: "/fr/about",
    component: _71a6ebb4,
    name: "about___fr"
  }
]
```

Tenga en cuenta que las rutas para la versión en inglés no tienen ningún prefijo porque es el idioma predeterminado; consulte la siguiente sección para obtener más detalles.

## Estrategia

Existen cuatro estrategias compatibles para generar las rutas de la aplicación:

### no_prefix

> :new: 6.1.0

Con esta estrategia, sus rutas no tendrán un prefijo de configuración local agregado. La configuración local se detectará y cambiará sin cambiar la URL. Esto implica que debe confiar en la detección del navegador y las cookies, e implementar interruptores locales llamando a la API i18n.

### prefix_except_default

Con esta estrategia, todas sus rutas tendrán un prefijo de configuración local agregado, excepto el idioma predeterminado.

### prefix

Con esta estrategia, todas las rutas tendrán un prefijo de configuración local.

### prefix_and_default

Esta estrategia combina los comportamientos de ambas estrategias anteriores, lo que significa que obtendrá URL con prefijos para cada idioma, pero las URL para el idioma predeterminado también tendrán una versión sin prefijo.

Para configurar la estrategia, use la opción `strategy`.
Make sure that you have a `defaultLocale` defined, especially if using **prefix_except_default**, **prefix_and_default** or **no_prefix** strategy. For other strategies it's also recommended to set it as it's gonna be used as a fallback when attempting to redirect from 404 page.

```js
// nuxt.config.js

['nuxt-i18n', {
  strategy: 'prefix_except_default',
  defaultLocale: 'en'
}]
```


## Rutas personalizadas

En algunos casos, es posible que desee traducir las URL además de tener el prefijo con el código de configuración regional. Hay 2 formas de configurar rutas personalizadas para sus páginas: opciones `in-component` o mediante la configuración del módulo.

### Opciones in-component

Agregue una propiedad `nuxtI18n.paths` a su página y configure sus rutas personalizadas allí:

```js
// pages/about.vue

export default {
  nuxtI18n: {
    paths: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: '/a-propos', // -> accessible at /fr/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}
```

Para configurar una ruta personalizada para una ruta dinámica, debe colocar los parámetros en el URI de forma similar a como lo haría en vue-router.

```js
// pages/articles/_name.vue

export default {
  nuxtI18n: {
    paths: {
      en: '/articles/:name',
      es: '/artículo/:name'
    }
  }
}
```

### Configuración del módulo

Asegúrese de establecer la opción  `parsePages` en `false` para deshabilitar el análisis de babel y agregar sus rutas personalizadas en la opción  `pages`:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,   // Disable babel parsing
  pages: {
    about: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: '/a-propos', // -> accessible at /fr/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}]
```

Tenga en cuenta que cada clave en el objeto `pages` debe corresponder a la ruta completa del archivo en su directorio `pages/`.

Asegúrese de que todas las llaves:
  1. Son relativos al directorio `pages/` y no comienzan con un `/`
  2. Apunte directamente a su archivo correspondiente sin `.vue` (asegúrese de agregar `/index` al traducir las rutas raíz)

Las rutas localizadas son URI completos, así que tenga en cuenta que:
  1. Necesitan comenzar con u `/`
  2. Debe repetir el URI completo para cada ruta secundaria

#### Ejemplo 1

Digamos que tiene alguna página anidada como:

```asciidoc
pages/
├── _nested/
├──── _route/
├────── index.vue
├────── _.vue
```

Así es como configuraría estas páginas en particular en la configuración:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    '_nested/_route/index': {
      en: '/mycustompath/:nested/:route?' // Params need to be put back here as you would with vue-router
    },
    '_nested/_route/_': {
      en: '/mycustompath/:nested/*' // * will match the entire route path after /:nested/
    }
  }
}]
```

#### Ejemplo 2

Con el siguiente directorio  `pages`:

```asciidoc
pages/
├── about.vue
├── services/
├──── index.vue
├──── development/
├────── index.vue
├────── app/
├──────── index.vue
├────── website/
├──────── index.vue
├──── coaching/
├────── index.vue
```

Debería configurar su propiedad `pages` de la siguiente manera:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    about: {
      en: '/about',
      fr: '/a-propos',
    },
    'services/index': {
      en: '/services',
      fr: '/offres',
    },
    'services/development/index': {
      en: '/services/development',
      fr: '/offres/developement',
    },
    'services/development/app/index': {
      en: '/services/development/app',
      fr: '/offres/developement/app',
    },
    'services/development/website/index': {
      en: '/services/development/website',
      fr: '/offres/developement/site-web',
    },
    'services/coaching/index': {
      en: '/services/coaching',
      fr: '/offres/formation',
    }
  }
}]
```

Si falta una ruta personalizada para una de las configuraciones locales, se usa la ruta personalizada `defaultLocale` si está establecida..


## Ignorar rutas


### Opciones in-component

Si desea que alguna página esté disponible solo para algunos idiomas, puede configurar una lista de idiomas compatibles para anular la configuración global:

```js
// pages/about.vue

export default {
  nuxtI18n: {
    locales: ['fr', 'es']
  }
}
```

Para deshabilitar completamente i18n en una página determinada:

```js
// pages/about.vue

export default {
  nuxtI18n: false
}
```

### Configuración del módulo

Si deshabilitó la opción `parsePages`, la localización puede deshabilitarse para páginas y configuraciones locales específicas configurando las configuraciones locales no deseadas en `false` en la configuración del módulo:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    about: {
      en: false,
    }
  }
}]
```

Para deshabilitar completamente la localización de rutas en una página determinada:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    about: false
  }
}]
```

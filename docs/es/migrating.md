# Guía de migración

Siga esta guía para actualizar de una versión principal a otra.


## Actualización de 5.x a 6.x

### Las funciones globales de SEO ahora están deshabilitadas por defecto

En algunos casos, tener SEO habilitado globalmente causó problemas de rendimiento y / o entró en conflicto con otros complementos. Para mitigar estos problemas, las características de SEO ahora están deshabilitadas de forma predeterminada.

Si se vio afectado por uno de los problemas anteriores, le recomendamos que lea la sección [Mejorar el rendimiento](https://nuxt-community.github.io/nuxt-i18n/seo.html#improving-performance) para habilitar el SEO solo donde lo necesites.

Si desea restaurar el comportamiento anterior, puede habilitar las funciones de SEO a nivel mundial estableciendo la opción `seo` en `true`:

```js
{
  seo: true
}
```

### Ya no se puede configurar preserveState

Anteriormente era posible configurar manualmente `preserveState` en el módulo de tienda de **nuxt-i18n**, lo que en realidad daría lugar a comportamientos inesperados al usar la representación del lado del servidor. Esta opción se ha eliminado por completo y la opción `preserveState` del módulo ahora está [establecida automáticamente](https://github.com/nuxt-community/nuxt-i18n/blob/05e9d1f80715cc23a545adf4303e49af3ee40ac3/src/plugins/main.js#L77).

Si estaba utilizando la opción de configuración `preserveState` anteriormente, puede eliminarse de manera segura:

```diff
 {
   vuex: {
-    preserveState: true,
     // other configuration options
   }
 }
```

### Las opciones del módulo de almacenamiento se han aplanado y renombrado

La opción de configuración `vuex` se usa para exponer una propiedad `mutations` donde cada mutación se puede deshabilitar o renombrar. Por el bien de la simplicidad, ya no es posible cambiar el nombre de estas mutaciones, la propiedad `mutations` se ha eliminado para aplanar la configuración y se ha cambiado el nombre de cada opción para reflejar mejor lo que hace.

```diff
 {
   vuex: {
-    mutations: {
-      setLocale: 'SET_LOCALE_MUTATION',
-      setMessages: 'SET_MESSAGE_MUTATION',
-      setRouteParams: 'SET_ROUTE_PARAMS_MUTATION'
-    }
+    syncLocale: true,
+    syncMessages: true,
+    syncRouteParams: true
   },
 }
 ```

## Actualización de 4.x a 5.x

Consulte [**vue-i18n** registro de cambios](https://github.com/kazupon/vue-i18n/blob/dev/CHANGELOG.md#800-2018-06-23) para obtener más información sobre cambios de última hora en **nuxt-i18n 5.x**.

## Actualización de 3.x a 4.x

### Opciones de clave in-component

v4.x introduce un solo cambio que requiere que cambie el nombre de la clave `i18n` a `nuxtI18n` en sus páginas que usan la configuración en componentes, esto debería evitar conflictos con vue-i18n.

**3.x:**

```js
// pages/about.vue

export default {
  i18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

**4.x:**

```js
// pages/about.vue

export default {
  nuxtI18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

## Actualización de 2.x a 3.x

### Rutas personalizadas

La opción `routes` se ha descartado a favor de la configuración en componentes, cualquier configuración de ruta personalizada debe colocarse en su archivo de página correspondiente.

**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      routes: {
        about: {
          fr: '/a-propos',
          en: '/about-us'
        }
      }
    }]
  ]
}
```

**3.x:**

```js
// pages/about.vue

export default {
  i18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

### Rutas ignoradas


La opción `ignorePaths` también se ha eliminado, su comportamiento se puede reproducir configurando `i18n` en `false` en sus páginas.

**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      ignorePaths: [
        '/fr/notlocalized'
      ]
    }]
  ]
}
```

**3.x:**

```js
// pages/fr/notlocalized.vue

export default {
  i18n: false
}
```

### noPrefixDefaultLocale

El `noPrefixDefaultLocale` se ha descartado en favor de la opción `strategy`.


**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      noPrefixDefaultLocale: false
    }]
  ]
}
```

**3.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      strategy: 'prefix'
    }]
  ]
}
```

### loadLanguagesAsync

La opción `loadLanguagesAsync` ha cambiado de nombre a `lazy`. La opción  `langFile` en `locales` ha cambiado de nombre a `file`.

### redirectCookieKey & useRedirectCookie

`redirectCookieKey` y `useRedirectCookie` se han fusionado en la opción `detectBrowserLanguage` y han cambiado el nombre a `cookieKey` y `useCookie` respectivamente.

**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      detectBrowserLanguage: true,
      redirectCookieKey: 'redirected',
      useRedirectCookie: true
    }]
  ]
}
```

**3.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      detectBrowserLanguage: {
        cookieKey: 'redirected',
        useCookie: true
      }
    }]
  ]
}
```

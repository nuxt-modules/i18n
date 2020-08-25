---
title: Detectar idioma del navegador
description: 'Por defecto, **nuxt-i18n** intenta redirigir a los usuarios a su idioma preferido al detectar el idioma de su navegador.  Esto está controlado por la opción  `detectBrowserLanguage`:'
position: 7
category: Guía
---

Por defecto, **nuxt-i18n** intenta redirigir a los usuarios a su idioma preferido al detectar el idioma de su navegador.  Esto está controlado por la opción  `detectBrowserLanguage`:


```js{}[nuxt.config.js]

['nuxt-i18n', {
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected'
  }
}]
```

Para evitar redirigir a los usuarios cada vez que visitan la aplicación, **nuxt-i18n** establece una cookie después de la primera redirección. Puede cambiar el nombre de la cookie configurando la opción `detectBrowserLanguage.cookieKey` a lo que desee, el valor predeterminado es _i18n_redirected_.

```js{}[nuxt.config.js]

['nuxt-i18n', {
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'my_custom_cookie_name'
  }
}]
```

Si prefiere que los usuarios sean redirigidos al idioma de su navegador cada vez que visitan la aplicación, deshabilite la cookie configurando `detectBrowserLanguage.useCookie` en `false`.

```js{}[nuxt.config.js]

['nuxt-i18n', {
  detectBrowserLanguage: {
    useCookie: false
  }
}]
```

Para deshabilitar por completo la función de detección de idioma del navegador, configure `detectBrowserLanguage` en `false`.

```js{}[nuxt.config.js]

['nuxt-i18n', {
  detectBrowserLanguage: false
}]
```

Para redirigir al usuario cada vez que visita la aplicación y mantener su elección seleccionada, habilite alwaysRedirect:

```js{}[nuxt.config.js]

['nuxt-i18n', {
  detectBrowserLanguage: {
    useCookie: true,
    alwaysRedirect: true
  }
}]
```

To use the cookie within a cross-origin environment (e.g. in an iFrame), you can set `crossOriginCookie: true`. This will change the cookie settings from `SameSite=Lax` to `SameSite=None; Secure`.

```js{}[nuxt.config.js]

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    crossOriginCookie: true
  }
}]
```

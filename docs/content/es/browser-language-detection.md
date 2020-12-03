---
title: Detectar idioma del navegador
description: 'Por defecto, **nuxt-i18n** intenta redirigir a los usuarios a su idioma preferido al detectar el idioma de su navegador.  Esto está controlado por la opción  `detectBrowserLanguage`:'
position: 7
category: Guía
---

Por defecto, **nuxt-i18n** intenta redirigir a los usuarios a su idioma preferido al detectar el idioma de su navegador.  Esto está controlado por la opción  `detectBrowserLanguage`:


```js{}[nuxt.config.js]

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected',
    onlyOnRoot: true,  // recommended
  }
}]
```

<alert type="info">

For better SEO, it's recommended to set `onlyOnRoot` to `true`. With it set, the language detection is only attempted when the user visits the root path (`/`) of the site. This allows crawlers to access the requested page rather than being redirected away based on detected locale. It also allows linking to pages in specific locales.

</alert>

Browser language is detected either from `navigator` when running on client-side, or from the `accept-language` HTTP header. Configured `locales` (or locales `iso` and/or `code` when locales are specified in object form) are matched against locales reported by the browser (for example `en-US,en;q=0.9,no;q=0.8`). If there is no exact match for the full locale, the language code (letters before `-`) are matched against configured locales.

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

To use the cookie within a cross-origin environment (e.g. in an iFrame), you can set `cookieCrossOrigin: true`. This will change the cookie settings from `SameSite=Lax` to `SameSite=None; Secure`.

```js{}[nuxt.config.js]

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieCrossOrigin: true
  }
}]
```

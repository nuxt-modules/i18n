---
title: Diferentes dominios
description: 'Es posible que desee utilizar un nombre de dominio diferente para cada idioma que admita su aplicación. Debe lograr esto:'
position: 9
category: Guía
---

Es posible que desee utilizar un nombre de dominio diferente para cada idioma que admita su aplicación. Debe lograr esto:

* Establezca la opción `differentDomains` en `true`
* Configure `locales` option as an array of objects, where each object has a `domain` key which value is the domain name you'd like to use for that locale (including port if non-default)

:::tip
You might want to set `detectBrowserLanguage` to `false`. When enabled (it is by default), user can get redirected to a different domain on first visit. Set to `false` if you want to ensure that visiting given domain always shows page in the corresponding locale.
:::

```js{}[nuxt.config.js]

['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      domain: 'mydomain.com'
    },
    {
      code: 'es',
      domain: 'es.mydomain.com'
    },
    {
      code: 'fr',
      domain: 'fr.mydomain.com'
    }
  ],
  differentDomains: true
  // Or enable the option in production only
  // differentDomains: (process.env.NODE_ENV === 'production')
}]
```

Cuando use diferentes nombres de dominio, su selector de idioma debe usar etiquetas regulares `<a>`:

```vue
<a
  v-for="locale in $i18n.locales"
  :href="switchLocalePath(locale.code)"
  :key="locale.code">
  {{ locale.code }}
</a>
```

## Variables de entorno de tiempo de ejecución

A veces es necesario cambiar dominios en diferentes entornos, por ejemplo: puesta en escena y producción. 
Como `nuxt.config.js` se usa en el momento de la compilación, sería necesario crear diferentes compilaciones para diferentes entornos.

La forma alternativa es mantener los dominios en la tienda Vuex bajo la propiedad `localeDomains`. Se puede acceder mediante el complemento
durante la inicialización, ahorrando el problema de construir múltiples imágenes.

```js{}[config/locale-domains.js]
module.exports = {
  uk: process.env.DOMAIN_UK,
  fr: process.env.DOMAIN_FR,
};
```

```js{}[nuxt.config.js]
const localeDomains = require('./config/locale-domains')
//...
[
  'nuxt-i18n',
  {
    differentDomains: process.env.NODE_ENV === 'production',
    locales: [
      {
        code: 'uk',
        domain: localeDomains.uk, // optional
      },
      {
        code: 'fr',
        domain: localeDomains.fr, // optional
      },
    ],
  },
]
```

```js{}[store/index.js]
const localeDomains = require('~~/config/locale-domains');

export const state = () => ({
  localeDomains,
});
```

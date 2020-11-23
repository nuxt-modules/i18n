---
title: Uso básico
description: 'La forma más rápida de comenzar con **nuxt-i18n** es definir la lista de entornos `locales` admitidos y proporcionar algunos mensajes de traducción a **vue-i18n** a través de la opción `vueI18n`:'
position: 3
category: Guía
---

La forma más rápida de comenzar con **nuxt-i18n** es definir la lista de entornos `locales` admitidos y proporcionar algunos mensajes de traducción a **vue-i18n** a través de la opción `vueI18n`:

```js{}[nuxt.config.js]
{
  modules: [
    'nuxt-i18n'
  ],

  i18n: {
    locales: ['en', 'fr', 'es'],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        en: {
          welcome: 'Welcome'
        },
        fr: {
          welcome: 'Bienvenue'
        },
        es: {
          welcome: 'Bienvenido'
        }
      }
    }
  }
}
```

Con esta configuración, **nuxt-i18n** genera URL localizadas para todas sus páginas, utilizando los códigos proporcionados en la opción de configuración local `locales` como prefijo, excepto la configuración local predeterminada `defaultLocale` (lea más sobre el [enrutamiento](/routing/)).

La opción `vueI18n` ahora se pasa a **vue-i18n**, consulte el [documento](https://kazupon.github.io/vue-i18n/) para ver las opciones disponibles.

## nuxt-link

Al representar enlaces internos en su aplicación usando `<nuxt-link>`, necesita obtener las URL adecuadas para la configuración local actual. Para hacer esto, **nuxt-i18n** registra una mezcla global que proporciona algunas funciones auxiliares:

* `localePath` – Devuelve la URL localizada para una página determinada. El primer parámetro puede ser el nombre de la ruta o un objeto para rutas más complejas. Se puede pasar un código de configuración regional como el segundo parámetro para generar un enlace para un idioma específico:

```vue
<nuxt-link :to="localePath('index')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="localePath('/')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="localePath('index', 'en')">Homepage in English</nuxt-link>
<nuxt-link :to="localePath('/app/profile')">Route by path to: {{ $t('Profile') }}</nuxt-link>
<nuxt-link :to="localePath('app-profile')">Route by name to: {{ $t('Profile') }}</nuxt-link>
<nuxt-link
  :to="localePath({ name: 'category-slug', params: { slug: category.slug } })">
  {{ category.title }}
</nuxt-link>
<!-- It's also allowed to omit 'name' and 'path'. -->
<nuxt-link :to="localePath({ params: { slug: 'ball' } })">{{ category.title }}</nuxt-link>
```

Tenga en cuenta que `localePath` utiliza el nombre base de la ruta para generar la URL localizada. El nombre base corresponde a los nombres que Nuxt genera al analizar su directorio `pages/`, más información en [el documento de Nuxt](https://nuxtjs.org/guides/features/file-system-routing).

* `switchLocalePath` – Devuelve un enlace a la página actual en otro idioma:

```vue
<nuxt-link :to="switchLocalePath('en')">English</nuxt-link>
<nuxt-link :to="switchLocalePath('fr')">Français</nuxt-link>
```

Por conveniencia, estos métodos también están disponibles en el contexto de la aplicación:

```js{}[/plugins/myplugin.js]

export default ({ app }) => {
  // Get localized path for homepage
  const localePath = app.localePath('index')
  // Get path to switch current route to French
  const switchLocalePath = app.switchLocalePath('fr')
}
```

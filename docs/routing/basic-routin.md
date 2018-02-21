# Basic Routing

**nuxt-i18n **overrides Nuxt default routes to add locale prefixes to every URL.  
Say your app supports two languages: French and English as the default language, and you have the following pages in your project:

```asciidoc
pages/
├── index.vue
├── about.vue
```

```js
[
  {
    path: "/",
    component: _3237362a,
    name: "index-en"
  },
  {
    path: "/fr/",
    component: _3237362a,
    name: "index-fr"
  },
  {
    path: "/about",
    component: _71a6ebb4,
    name: "about-en"
  },
  {
    path: "/fr/about",
    component: _71a6ebb4,
    name: "about-fr"
  }
]
```

Note that routes for the English version do not have any prefix because it is the default language. If you want to have prefixes for all languages, either set `noPrefixDefaultLocale` option to `true`, or omit `defaultLocale` option.


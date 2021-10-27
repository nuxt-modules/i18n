---
title: Routing
description: "**@nuxtjs/i18n** overrides Nuxt default routes to add locale prefixes to every URL (except in no_prefix strategy)."
position: 6
category: Guide
---

**@nuxtjs/i18n** overrides Nuxt default routes to add locale prefixes to every URL (except in `no_prefix` strategy).
Say your app supports two languages: French and English as the default language, and you have the following pages in your project:

```asciidoc
pages/
├── index.vue
├── about.vue
```

This would result in the following routes being generated

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

Note that routes for the English version do not have any prefix because it is the default language, see [strategies](/strategies) for more details.

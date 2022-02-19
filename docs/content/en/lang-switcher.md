---
title: Lang Switcher
description: "When **@nuxtjs/i18n** loads in your app, it adds your `locales` configuration to `this.$i18n` (or `app.i18n`), which makes it really easy to display a lang switcher anywhere in your app."
position: 10
category: Guide
---

When **@nuxtjs/i18n** loads in your app, it adds your `locales` configuration to `this.$i18n` (or `app.i18n`), which makes it really easy to display a lang switcher anywhere in your app.

Here's an example lang switcher where a `name` key has been added to each locale object in order to display friendlier titles for each link:

```vue
<nuxt-link
  v-for="locale in availableLocales"
  :key="locale.code"
  :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
```

```js
computed: {
  availableLocales () {
    return this.$i18n.locales.filter(i => i.code !== this.$i18n.locale)
  }
}
```

```js {}[nuxt.config.js]
i18n: {
  locales: [
    {
      code: 'en',
      name: 'English'
    },
    {
      code: 'es',
      name: 'Español'
    },
    {
      code: 'fr',
      name: 'Français'
    }
  ]
}
```

<alert type="info">

When using `detectBrowserLanguage` and wanting to persist locale on a route change, you must call one of the functions that update the stored locale cookie. Call either [`setLocaleCookie(locale)`](/api#setlocalecookie) to persist just the cookie locale or [`setLocale(locale)`](/api#setlocale) to both persist the cookie locale and switch the route to the specified locale. Otherwise, locale might switch back to the saved one during navigation.

</alert>


The template code might look like this, for example:
```vue
<a
  href="#"
  v-for="locale in availableLocales"
  :key="locale.code"
  @click.prevent.stop="$i18n.setLocale(locale.code)">{{ locale.name }}</a>
```

## Dynamic route parameters

Dealing with dynamic route parameters requires a bit more work because you need to provide parameters translations to **@nuxtjs/i18n**. For this purpose, **@nuxtjs/i18n**'s store module exposes a `routeParams` state property that will be merged with route params when generating lang switch routes with `switchLocalePath()`.

<alert type="warning">

Make sure that Vuex [is enabled](https://nuxtjs.org/guides/directory-structure/store) in your app and that you did not set `vuex` option to `false` in **@nuxtjs/i18n**'s options.

</alert>

To provide dynamic parameters translations, dispatch the `i18n/setRouteParams` mutation as early as possible when loading a page. The passed in object must contain the mappings from the locale `code` to an object with a mapping from slug name to expected slug value for given locale.

An example (replace `postId` with the appropriate route parameter):

```vue
<template>
  <!-- pages/post/_postId.vue -->
</template>

<script>
export default {
  async asyncData ({ store }) {
    await store.dispatch('i18n/setRouteParams', {
      en: { postId: 'my-post' },
      fr: { postId: 'mon-article' }
    })
  }
}
</script>
```

Note that for the special case of the catch-all route named `_.vue`, the key of the object needs to say `pathMatch`. For example:

```vue
<template>
  <!-- pages/_.vue -->
</template>

<script>
export default {
  async asyncData ({ store }) {
    await store.dispatch('i18n/setRouteParams', {
      en: { pathMatch: 'my-post/abc' },
      fr: { pathMatch: 'mon-article/xyz' }
    })
  }
}
</script>
```

<alert type="info">

**@nuxtjs/i18n** won't reset parameters translations for you, this means that if you use identical parameters for different routes, navigating between those routes might result in conflicting parameters. Make sure you always set params translations in such cases.

</alert>

## Wait for page transition

By default, the locale will be changed right away when navigating to a route with a different locale which means that if you have a page transition, it will fade out the page with the text already switched to the new language and fade back in with the same content.

To work around the issue, you can set the option [`skipSettingLocaleOnNavigate`](./options-reference#skipsettinglocaleonnavigate) to `true` and handle setting the locale yourself from a `beforeEnter` transition hook defined in a plugin.

```js {}[nuxt.config.js]
export default {
  plugins: ['~/plugins/router'],

  i18n: {
    // ... your other options
    skipSettingLocaleOnNavigate: true,
  }
}
```

```js {}[~/plugins/router.js]
export default ({ app }) => {
  app.nuxt.defaultTransition.beforeEnter = () => {
    app.i18n.finalizePendingLocaleChange()
  }

  // Optional: wait for locale before scrolling for a smoother transition
  app.router.options.scrollBehavior = async (to, from, savedPosition) => {
    // Make sure the route has changed
    if (to.name !== from.name) {
      await app.i18n.waitForPendingLocaleChange()
    }
    return savedPosition || { x: 0, y: 0 }
  }
}
```

If you have a specific transition defined in a page component, you would also need to call `finalizePendingLocaleChange` from there.

```js {}[~/pages/foo.vue]
export default {
  transition: {
    beforeEnter() {
      this.$i18n.finalizePendingLocaleChange()
    }
  }
}
```

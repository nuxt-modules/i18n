# Ignoring localized routes

Customize localized route exclusions per page component.

---

::: warning
This feature is not supported with the `no-prefix` [strategy](/guide/routing-strategies).
:::

If you'd like some pages to be available in some languages only, you can configure the list of supported languages to override the global settings. The options can be specified within either the page components themselves or globally, within the module configuration.

### Pick localized routes

:::code-group

```js {}[Page components - pages/about.vue]
<script setup>
defineI18nRoute({
  locales: ['fr', 'es']
})
</script>
```

```js {}[Module configuration - nuxt.config.js]
i18n: {
  customRoutes: false,
  pages: {
    about: {
      en: false,
    }
  }
}
```
:::

### Disable localized routes

:::code-group
```js {}[Page components - pages/about.vue]
<script setup>defineI18nRoute(false)</script>
```
```js {}[Module configuration - nuxt.config.js]
i18n: {
  customRoutes: 'config',
  pages: {
    about: false
  }
}
```
:::

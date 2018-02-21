# Ignore Routes

To prevent nuxt-i18n from generating localized URLs for some pages, use the `ignorePaths` option:

```js
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

```
pages/
├── fr/
├──── notlocalized.vue <── this page will be skipped when generating localized routes
```




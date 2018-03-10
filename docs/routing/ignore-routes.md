# Ignore Routes

To prevent nuxt-i18n from generating localized URLs for some pages, use the `ignorePaths` option:

```js
{
  modules: [
    ['nuxt-i18n', {
      ignorePaths: [
        '/fr/notlocalized',
        '^/de.*' // You can also use a regex pattern
      ]
    }]
  ]
}
```

```
pages/
├── fr/
├──── notlocalized.vue <── this page will be skipped when generating localized routes
├── de/                <–- all routes starting with /de will be skipped as well
├──── index.vue
```




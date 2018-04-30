# Different domains

You might want to use a different domain name for each language your app supports. To achieve this:

* Set `differentDomains` option to `true`
* Configure `locales` option as an array of object, where each object has a `domain` key which value is the domain name you'd like to use for the locale

```js
// nuxt.config.js

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

When using different domain names, your lang swicher should use regular `<a>` tags:

```vue
<a
  v-for="locale in $i18n.locales"
  :href="switchLocalePath(locale.code)"
  :key="locale.code">
  {{ locale.code }}
</a>
```

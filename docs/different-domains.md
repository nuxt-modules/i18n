# Different domains

You might want to use a specific domain name for each language your app supports. To achieve this, enable `differentDomains` option and define every domain name in the `locales` option:

```js
{
  locales: [
    {
      code: 'en',
      domain: 'mydomain.com',
    },
    {
      code: 'fr',
      domain: 'fr.mydomain.com',
    },
  ],
  differentDomains: true
  // Or enable the option in production only
  // differentDomains: (process.env.NODE_ENV === 'production')
}
```

When using different domain names, your lang swicher should use regular `<a>` tags:

```html
<a
  v-for="locale in $i18n.locales"
  :href="switchLocalePath(locale.code)"
  :key="locale.code">
  {{ locale.code }}
</a>
```
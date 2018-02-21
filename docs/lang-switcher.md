# Lang Switcher

To display a lang switcher anywhere in your app, you can access options `locales` and `defaultLocale` which are both added to `app.$i18n`:

```html
<nuxt-link
  v-for="(locale, index) in $i18n.locales"
  v-if="locale.code !== $i18n.locale"
  :key="index"
  :exact="true"
  :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
```




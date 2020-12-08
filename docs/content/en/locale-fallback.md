---
title: Locale fallback
description: "How a fallback gets selected when a translation is missing"
position: 11
category: Guide
---

## Locale fallback

**nuxt-i18n** takes advantage of **vue-i18n** ability. It is possible to define a single fallback locale, or a decision map for more specific needs.

### One fallback

The simplest way is defining a single fallback, whatever the wanted locale was. In this example, **en** fallback will be chosen for any missing locale.

```
modules: [
  'nuxt-i18n'
],

i18n: { 
  vueI18n: {
    fallbackLocale: 'en',
  }
}
```

### Decision map fallback

For more specific news, it is possible to define a chain of fallback for each locale. Example:

```
modules: [
  'nuxt-i18n'
],

i18n: { 
  vueI18n: {
    fallbackLocale: {
      /* 1 */ 'de-CH':   ['fr', 'it'],
      /* 2 */ 'zh-Hant': ['zh-Hans'],
      /* 3 */ 'es-CL':   ['es-AR'],
      /* 4 */ 'es':      ['en-GB'],
      /* 5 */ 'pt':      ['es-AR'],
      /* 6 */ 'default': ['en', 'da']
    }
  }
}
```

will result in the following fallback chains

| locale |	fallback chains |
| ------- | ----------------|
|'de-CH' |	de-CH > fr > it > en > da|
|'de' |	de > en > da|
|'zh-Hant' |	zh-Hant > zh-Hans > zh > en > da|
|'es-SP' |	es-SP > es > en-GB > en > da|
|'es-SP!' |	es-SP > en > da|
|'fr' |	fr > en > da|
|'pt-BR' |	pt-BR > pt > es-AR > es > en-GB > en > da|
|'es-CL' |	es-CL > es-AR > es > en-GB > en > da|

More information in [vue-i18n documentation](https://kazupon.github.io/vue-i18n/guide/fallback.html#explicit-fallback-with-decision-maps).

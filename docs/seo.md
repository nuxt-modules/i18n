# SEO

By default, **nuxt-i18n** adds some metadata to help with your pages SEO. This can be disabled by setting `seo` option to `false`. Here's what it does:

* Add a _lang_ attribute containing the current locale's ISO code to the `<html>` tag.
* Generate `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. For each language, the ISO code is used as `hreflang` attribute's value.

To customize SEO metadata for any page, simply declare your own `head()` method, have a look at [lib/templates/i18n.seo.plugin.js](https://github.com/nuxt-community/nuxt-i18n/blob/master/lib/templates/i18n.seo.plugin.js) if you want to copy some of **nuxt-i18n**'s logic.


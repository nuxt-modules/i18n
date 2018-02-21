Options

| Option | Type | Default value | Description |
| :--- | :--- | :--- | :--- |
| locales | Array |  | A list of objects that describes the locales available in your app, each object should contain at least a \`code\` key |
| defaultLocale | String |  | The app's default locale, URLs for this language won't be prefixed with the locale code |
| vueI18n | Object |  | Configuration options for vue-i18n, refer to \[the doc\]\(http://kazupon.github.io/vue-i18n/en/api.html\#constructor-options\) for supported options |
| routes | Object |  | Custom routing configuration, if routes are omitted, Nuxt's default routes are used |
| ignorePaths | Array |  | A list of paths that should not be localized |
| noPrefixDefaultLocale | Boolean | true | By default, paths generated for the default language don't contain a locale prefix, set this option to \`false\` to disable this behavior |
| redirectRootToLocale | String |  | Specify a locale to which the user should be redirected when visiting root URL \(/\), doesn't do anything if \`noPrefixDefaultLocale\` is enabled |
| seo | Boolean | true | Set to \`false\` to disable SEO metadata generation |
| loadLanguagesAsync | Boolean | false | If \`true\`, the module will attempt to asynchronously load translations from files defined in \`langFiles\`, when using this, \`vueI18n.messages\` can be omitted and language files should be referenced using a \`langFile\` key in \`locales\` objects |
| langDir | String | lang/ | Directory in which translations files are stored \(used when loading translations asynchronously\) |




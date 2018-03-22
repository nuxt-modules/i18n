# Options

| Option | Type | Default value | Description |
| :--- | :--- | :--- | :--- |
| locales | Array |  | A list of objects that describes the locales available in your app, each object should contain at least a \`code\` key |
| defaultLocale | String |  | The app's default locale, URLs for this language won't be prefixed with the locale code |
| vueI18n | Object |  | Configuration options for vue-i18n, refer to \[the doc\]\([http://kazupon.github.io/vue-i18n/en/api.html\#constructor-options\](http://kazupon.github.io/vue-i18n/en/api.html#constructor-options%29\) for supported options |
| routes | Object |  | Custom routing configuration, if routes are omitted, Nuxt's default routes are used |
| ignorePaths | Array |  | A list of paths that should not be localized |
| noPrefixDefaultLocale | Boolean | true | By default, paths generated for the default language don't contain a locale prefix, set this option to \`false\` to disable this behavior |
| redirectRootToLocale | String |  | Specify a locale to which the user should be redirected when visiting root URL \(/\) |
| seo | Boolean | true | Set to \`false\` to disable SEO metadata generation |
| loadLanguagesAsync | Boolean | false | If \`true\`, the module will attempt to asynchronously load translations from files defined in \`langFiles\`, when using this, \`vueI18n.messages\` can be omitted and language files should be referenced using a \`langFile\` key in \`locales\` objects |
| langDir | String | lang/ | Directory in which translations files are stored \(used when loading translations asynchronously\) |
| detectBrowserLanguage | Boolean | false | Enables browser's language detection feature to automatically redirect users to their favorite language |
| redirectCookieKey | String | 'redirected' | Name of the cookie that is set after a user first visits the app with detectBrowserLanguage enabled |
| useRedirectCookie | Boolean | true | Set to false to always trigger redirection based on browser's language \(if detectBrowserLanguage is enabled\) |
| beforeLanguageSwitch | Function | \(oldLocale, newLocale\) =&gt; {} | Callback called before changing the app's locale |
| onLanguageSwitched | Function | \(oldLocale, newLocale\) =&gt; {} | Callback called once the app's locale has been changed |




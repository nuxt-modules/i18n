<%
const { lazy, locales, langDir, vueI18n } = options.options
const { fallbackLocale } = vueI18n || {}
const syncLocaleFiles = new Set()
const asyncLocaleFiles = new Set()

if (langDir) {
  if (fallbackLocale && typeof (fallbackLocale) === 'string') {
    const localeObject = locales.find(l => l.code === fallbackLocale)
    if (localeObject) {
      syncLocaleFiles.add(localeObject.file)
    }
  }
  for (const locale of locales) {
    if (!syncLocaleFiles.has(locale.file) && !asyncLocaleFiles.has(locale.file)) {
      (lazy ? asyncLocaleFiles : syncLocaleFiles).add(locale.file)
    }
  }
  for (const file of syncLocaleFiles) {
%>import locale<%= hash(file) %> from '<%= `../${relativeToBuild(langDir, file)}` %>'
<%
  }
}
%>

<%
function stringifyValue(value) {
  if (value === undefined || typeof value === 'function') {
    return String(value);
  } else {
    return JSON.stringify(value)
  }
}

for (const [rootKey, rootValue] of Object.entries(options)) {
  if (Array.isArray(rootValue)) {
%>export const <%= rootKey %> = <%= stringifyValue(rootValue) %>
<%
  } else {
%>export const <%= rootKey %> = {
<%
    for (const [key, value] of Object.entries(rootValue)) {
      if (key === 'vueI18n' && typeof value === 'string') {
%>  <%= key %>: (context) => import('<%= value %>').then(m => m.default(context)),
<%
      } else {
%>  <%= key %>: <%= stringifyValue(value) %>,
<%
      }
    }
%>}
<%
  }
}

if (langDir) { %>
export const localeMessages = {
<%
  // The messages for the fallback locale are imported synchronously and available from the main bundle as then
  // it doesn't need to be included in every server-side response and can take better advantage of browser caching.
  for (const file of syncLocaleFiles) {%>
  <%= `'${file}': () => Promise.resolve(locale${hash(file)}),` %><%
  }
  for (const file of asyncLocaleFiles) {%>
  <%= `'${file}': () => import('../${relativeToBuild(langDir, file)}' /* webpackChunkName: "lang-${file}" */),` %><%
  }
%>
}
<%
} else {
%>
export const localeMessages = {}
<%
}
%>

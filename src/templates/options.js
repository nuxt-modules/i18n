<%
const { lazy, locales, langDir, vueI18n } = options.options
const { fallbackLocale } = vueI18n || {}
let fallbackLocaleFile = ''
if (lazy && langDir && vueI18n && fallbackLocale && typeof (fallbackLocale) === 'string') {
  const l = locales.find(l => l.code === fallbackLocale)
  if (l) {
    fallbackLocaleFile = l.file
%>import fallbackMessages from '<%= `../${relativeToBuild(langDir, l.file)}` %>'

<%
  }
}

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

if (lazy && langDir) { %>
export const localeMessages = {
<%
  const files = new Set(locales.map(l => l.file))
  // The messages for the fallback locale are imported synchronously and available from the main bundle as then
  // it doesn't need to be included in every server-side response and can take better advantage of browser caching.
  for (const file of files) {
    if (file === fallbackLocaleFile) {%>
  <%= `'${file}': () => Promise.resolve(fallbackMessages),` %><%
    } else {%>
  <%= `'${file}': () => import('../${relativeToBuild(langDir, file)}' /* webpackChunkName: "lang-${file}" */),` %><%
    }
  }
%>
}
<%
}
%>

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

const { lazy, locales, langDir } = options.options
if (lazy && langDir) { %>
export const asyncLocales = {
  <%= Array.from(
        new Set(locales.map(l => `'${l.file}': () => import('../${relativeToBuild(langDir, l.file)}' /* webpackChunkName: "lang-${l.file}" */)`))
      ).join(',\n  ') %>
}
<%
}
%>

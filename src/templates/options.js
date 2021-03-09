<%
function stringifyValue(value) {
  if (value === undefined || typeof value === 'function') {
    return String(value);
  } else {
    return JSON.stringify(value)
  }
}

for (const [key, value] of Object.entries(options)) {
    if (key === 'vueI18n' && typeof value === 'string') {
%>export const <%= key %> = (context) => import('<%= value %>').then(m => m.default(context))
<%
    } else {
%>export const <%= key %> = <%= stringifyValue(value) %>
<%
    }
}
%>

<% if (options.lazy && options.langDir) { %>
export const ASYNC_LOCALES = {
  <%= Array.from(
        new Set(options.locales.map(l => `'${l.file}': () => import('../${relativeToBuild(options.langDir, l.file)}' /* webpackChunkName: "lang-${l.file}" */)`))
      ).join(',\n  ') %>
}
<% } %>

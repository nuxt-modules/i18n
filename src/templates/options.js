<%
function stringifyValue(value) {
  if (typeof value === 'string') {
    return `'${value}'`
  } else if (value === undefined || value === null || typeof value === 'boolean' || typeof value === 'function') {
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

/* <% if (options.langDir) { %> */
export const ASYNC_LOCALES = {
  <%= options.locales.map(l => `'${l.code}': () => import('../${relativeToBuild(options.langDir, l.file)}' /* webpackChunkName: "lang-${l.file}" */)`).join(',\n  ') %>
}
/* <% } %> */

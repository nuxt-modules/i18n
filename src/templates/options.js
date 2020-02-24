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
%>export const <%= key %> = require('<%= value %>').default
<%
    } else {
%>export const <%= key %> = <%= stringifyValue(value) %>
<%
    }
}
%>

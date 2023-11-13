// @ts-nocheck
<% options.importStrings.forEach(function (importer) { %>
<%= importer %><% }); %>

export const localeCodes = <%= JSON.stringify(options.localeCodes, null, 2) %>;

export const localeMessages = { <% options.localeMessages.forEach(function ([key, val]) { %>
  "<%= key %>": [<% val.forEach(function (entry) { %>
      { key: <%= entry.key %>, load: <%= entry.load %>, cache: <%= entry.cache %> },<% }); %>
  ],<% }); %>
}

export const vueI18nConfigs = [<% options.vueI18nConfigs.forEach(function (importer) { %>
  <%= importer %>,<% }); %>
]

export const nuxtI18nOptions = <%= JSON.stringify(options.nuxtI18nOptions, null, 2) %>

export const nuxtI18nOptionsDefault = <%= JSON.stringify(options.nuxtI18nOptionsDefault, null, 2) %>

export const nuxtI18nInternalOptions = <%= JSON.stringify(options.nuxtI18nInternalOptions, null, 2) %>
 
export const NUXT_I18N_MODULE_ID = "<%= options.NUXT_I18N_MODULE_ID %>"
export const parallelPlugin = <%= options.parallelPlugin %>
export const isSSG = <%= options.isSSG %>

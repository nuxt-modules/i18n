// @ts-nocheck
<% options.importStrings.forEach(function (importer) { %>
<%= importer %><% }); %>

export const localeCodes = <%= JSON.stringify(options.localeCodes, null, 2) %>

export const localeMessages = { <% options.localeMessages.forEach(function ([key, val]) { %>
  "<%= key %>": [<% val.forEach(function (entry) { %>
      { key: <%= entry.key %>, load: <%= entry.load %>, cache: <%= entry.cache %> },<% }); %>
  ],<% }); %>
}

export const resolveNuxtI18nOptions = async (context) => {
  const nuxtI18nOptions = <%= JSON.stringify(options.nuxtI18nOptions, null, 2) %>
  
  const vueI18nConfigLoader = async loader => {
    const config = await loader().then(r => r.default || r)
    if (typeof config === 'object') return config
    if (typeof config === 'function') return await config()
    return {}
  }

  const deepCopy = (src, des, predicate) => {
    for (const key in src) {
      if (typeof src[key] === 'object') {
        if (!(typeof des[key] === 'object')) des[key] = {}
        deepCopy(src[key], des[key], predicate)
      } else {
        if (predicate) {
          if (predicate(src[key], des[key])) {
            des[key] = src[key]
          }
        } else {
          des[key] = src[key]
        }
      }
    }
  }
  
  const mergeVueI18nConfigs = async (loader) => {
    const layerConfig = await vueI18nConfigLoader(loader)
    const cfg = layerConfig || {}
    
    for (const [k, v] of Object.entries(cfg)) {
      if(nuxtI18nOptions.vueI18n?.[k] === undefined || typeof nuxtI18nOptions.vueI18n?.[k] !== 'object') {
        nuxtI18nOptions.vueI18n[k] = v
      } else {
        deepCopy(v, nuxtI18nOptions.vueI18n[k])
      }
    }
  }

  nuxtI18nOptions.vueI18n = { messages: {} }
  <% options.vueI18nConfigs.forEach(function (importer) { %>
  await mergeVueI18nConfigs(<%= importer %>) <% }); %>
    
  return nuxtI18nOptions
}

export const nuxtI18nOptionsDefault = <%= JSON.stringify(options.nuxtI18nOptionsDefault, null, 2) %>

export const nuxtI18nInternalOptions = <%= JSON.stringify(options.nuxtI18nInternalOptions, null, 2) %>
 
export const NUXT_I18N_MODULE_ID = <%= options.NUXT_I18N_MODULE_ID %>
export const parallelPlugin = <%= options.parallelPlugin %>
export const isSSG = <%= options.isSSG %>

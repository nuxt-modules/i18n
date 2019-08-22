const LOCALE_CODE_KEY = '<%= options.LOCALE_CODE_KEY %>'
const LOCALE_DOMAIN_KEY = '<%= options.LOCALE_DOMAIN_KEY %>'
const LOCALE_FILE_KEY = '<%= options.LOCALE_FILE_KEY %>'
const getLocaleCodes = <%= options.getLocaleCodes %>
const locales = <%= JSON.stringify(options.locales) %>
const localeCodes = getLocaleCodes(locales)

const isObject = value => value && !Array.isArray(value) && typeof value === 'object'

/**
 * Asynchronously load messages from translation files
 * @param  {Context}  context  Nuxt context
 * @param  {String}   locale  Language code to load
 */
export async function loadLanguageAsync (context, locale) {
  const { app } = context;

  if (!app.i18n.loadedLanguages) {
    app.i18n.loadedLanguages = []
  }

  if (!app.i18n.loadedLanguages.includes(locale)) {
    const langOptions = app.i18n.locales.find(l => l[LOCALE_CODE_KEY] === locale)
    if (langOptions) {
      const file = langOptions[LOCALE_FILE_KEY]
      if (file) {
        <% if (options.langDir) { %>
        try {
          const module = await import(/* webpackChunkName: "lang-[request]" */ '~/<%= options.langDir %>' + file)
          const messages = module.default ? module.default : module
          const result = typeof messages === 'function' ? await Promise.resolve(messages(context)) : messages
          app.i18n.setLocaleMessage(locale, result)
          app.i18n.loadedLanguages.push(locale)
        } catch (error) {
          console.error(error)
        }
        <% } %>
      } else {
        console.warn('[<%= options.MODULE_NAME %>] Could not find lang file for locale ' + locale)
      }
    }
  }
}

/**
 * Validate setRouteParams action's payload
 * @param {*} routeParams The action's payload
 */
export const validateRouteParams = routeParams => {
  if (!isObject(routeParams)) {
    console.warn(`[<%= options.MODULE_NAME %>] Route params should be an object`)
    return
  }
  Object.entries(routeParams).forEach(([key, value]) => {
    if (!localeCodes.includes(key)) {
      console.warn(`[<%= options.MODULE_NAME %>] Trying to set route params for key ${key} which is not a valid locale`)
    } else if (!isObject(value)) {
      console.warn(`[<%= options.MODULE_NAME %>] Trying to set route params for locale ${key} with a non-object value`)
    }
  })
}

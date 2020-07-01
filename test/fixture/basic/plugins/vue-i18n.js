import MessageFormat from 'messageformat'

/**
 * @param {import('@nuxt/types').Context} context
 *
 * @return {import('vue-i18n').Formatter}
 */
function createCustomFormatter (context) {
  const formatter = new MessageFormat(['en', 'fr'])
  const caches = Object.create(null)

  return {
    interpolate (message, values) {
      let fn = caches[message]
      if (!fn) {
        fn = formatter.compile(message.toUpperCase(), context.app.i18n.locale)
        caches[message] = fn
      }
      return [fn(values)]
    }
  }
}

/**
 * @param {import('@nuxt/types').Context} context
 *
 * @return {import('vue-i18n').I18nOptions}
 */
export default context => {
  const formatter = createCustomFormatter(context)

  return {
    formatter,
    messages: {
      fr: {
        home: 'Accueil',
        about: 'À propos',
        posts: 'Articles'
      },
      en: {
        home: 'Homepage',
        about: 'About us',
        posts: 'Posts'
      }
    },
    fallbackLocale: 'en'
  }
}

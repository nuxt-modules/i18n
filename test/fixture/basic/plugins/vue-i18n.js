import MessageFormat from 'messageformat'

class CustomFormatter {
  constructor (context) {
    this._context = context
    this._formatter = new MessageFormat(['en', 'fr'])
    this._caches = Object.create(null)
  }

  interpolate (message, values) {
    let fn = this._caches[message]
    if (!fn) {
      fn = this._formatter.compile(message.toUpperCase(), this._context.app.i18n.locale)
      this._caches[message] = fn
    }
    return [fn(values)]
  }
}

export default context => {
  const formatter = new CustomFormatter(context)

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

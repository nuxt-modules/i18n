/**
 * @param {import('@nuxt/types').Context} _
 * @param {string} locale
 * @return {object}
 */
export default (_, locale) => {
  return {
    home: 'Accueil',
    about: 'À propos',
    posts: 'Articles',
    locale
  }
}

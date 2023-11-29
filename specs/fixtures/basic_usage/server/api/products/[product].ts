import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import productsData from '../products-data'

/**
 * NOTE:
 *  locale resources is managed on backend examples
 */

const locales: LocaleMessages<DefineLocaleMessage> = {
  'en-GB': {
    settings: {
      profile: 'Profile'
    }
  },
  ja: {}
}

export default defineEventHandler(event => {
  const slug = event.context.params?.product
  const found = productsData.find(x => Object.values(x.slugs).includes(slug))

  if (found == null) {
    return {}
  }

  return found
})

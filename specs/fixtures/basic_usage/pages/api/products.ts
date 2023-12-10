import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import productsData from './products-data'
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
  return productsData
})

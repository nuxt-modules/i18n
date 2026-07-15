import { createI18n } from 'vue-i18n'

// message compilation requires the full vue-i18n build in the nitro bundle (#2220)
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: { hello: 'Hello, {name}!' }
  }
})

export default defineEventHandler(() => {
  return { message: i18n.global.t('hello', { name: 'nitro' }) }
})

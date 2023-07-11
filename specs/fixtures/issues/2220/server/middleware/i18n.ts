import { defineEventHandler, getCookie } from 'h3'
import { createI18n } from 'vue-i18n'
import locales from '../../locales'
import en from '../../locales/en.json'
import ru from '../../locales/ru.json'

const resources = {
  en,
  ru
}

const i18n = createI18n({
  fallbackLocale: 'en'
}).global

for (const { code } of locales) {
  i18n.setLocaleMessage(code, resources[code])
}

export default defineEventHandler(e => {
  e.context.$t = (key: string) => i18n.t(key, getCookie(e, 'lang') || i18n.fallbackLocale.toString())
})

declare module 'h3' {
  interface H3EventContext {
    $t: typeof i18n.t
  }
}

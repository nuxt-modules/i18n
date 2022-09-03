import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.$i18n.onBeforeLanguageSwitch = (oldLocale, newLocale, isInitialSetup, nuxtApp) => {
    console.log('onBeforeLanguageSwitch', oldLocale, newLocale, isInitialSetup)
  }
  // onLanguageSwitched called right after a new locale has been set
  nuxtApp.$i18n.onLanguageSwitched = (oldLocale, newLocale) => {
    console.log('onLanguageSwitched', oldLocale, newLocale)
  }
})

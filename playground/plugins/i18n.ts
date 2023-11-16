import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('i18n:beforeLocaleSwitch', ({ oldLocale, newLocale, initialSetup }) => {
    console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initialSetup)
  })

  nuxtApp.hook('i18n:localeSwitched', ({ oldLocale, newLocale }) => {
    console.log('onLanguageSwitched', oldLocale, newLocale)
  })
})

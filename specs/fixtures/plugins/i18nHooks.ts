import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('i18n:beforeLocaleSwitch', ({ oldLocale, newLocale, initialSetup }) => {
    console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initialSetup)

    if (newLocale === 'en') {
      return 'fr'
    }
  })

  nuxtApp.hook('i18n:localeSwitched', ({ oldLocale, newLocale }) => {
    console.log('onLanguageSwitched', oldLocale, newLocale)
  })
})

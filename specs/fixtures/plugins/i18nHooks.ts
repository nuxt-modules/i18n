import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('i18n:beforeLocaleSwitch', ({ oldLocale, newLocale, initialSetup }) => {
    let overrideLocale = newLocale

    if (newLocale === 'kr') {
      overrideLocale = 'fr'
    }

    console.log('onBeforeLanguageSwitch', oldLocale, overrideLocale, initialSetup)

    if (overrideLocale !== newLocale) {
      return overrideLocale
    }
  })

  nuxtApp.hook('i18n:localeSwitched', ({ oldLocale, newLocale }) => {
    console.log('onLanguageSwitched', oldLocale, newLocale)
  })
})

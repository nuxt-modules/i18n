import { defineNuxtPlugin } from '#imports'

function log(...args: any[]) {
  if (import.meta.server && process.send) {
    process.send({ type: 'i18n:test-log', id: process.env.PORT, data: Array.from(args).join(' ') })
    // !import.meta.CI && console.log(...args)
  } else {
    console.log(...args)
  }
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook('i18n:beforeLocaleSwitch', data => {
    if (data.newLocale === 'kr') {
      data.newLocale = 'fr'
    }

    log('i18n:beforeLocaleSwitch', data.oldLocale, data.newLocale, data.initialSetup)
  })

  nuxtApp.hook('i18n:localeSwitched', ({ oldLocale, newLocale }) => {
    log('i18n:localeSwitched', oldLocale, newLocale)
  })
})

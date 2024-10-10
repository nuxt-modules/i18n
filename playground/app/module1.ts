import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    // @ts-ignore
    await nuxt.hook('i18n:extend-messages', (messages, localeCodes) => {
      messages.push({
        en: {
          foo: 'Foo'
        },
        fr: {
          foo: 'Foo FR'
        },
        ja: {
          foo: 'Foo JA'
        }
      })
    })
  }
})

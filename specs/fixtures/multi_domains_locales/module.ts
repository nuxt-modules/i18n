import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  async setup(options, nuxt) {
    // @ts-ignore
    await nuxt.hook('i18n:extend-messages', (messages, localeCodes) => {
      messages.push({
        en: {
          'my-module-exemple': {
            hello: 'Hello from external module'
          }
        },
        fr: {
          'my-module-exemple': {
            hello: 'Bonjour depuis le module externe'
          }
        }
      })
    })
  }
})

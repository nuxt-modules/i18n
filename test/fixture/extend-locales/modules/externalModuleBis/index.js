/** @type {import('@nuxt/types').Module} */
export default function () {
  const { nuxt } = this

  nuxt.hook('i18n:extend-messages', function (additionalMessages) {
    additionalMessages.push({
      en: {
        'external-module-bis': {
          hello: 'Hello external module bis'
        }
      },
      fr: {
        'external-module-bis': {
          hello: 'Bonjour module externe bis'
        }
      }
    })
  })
}

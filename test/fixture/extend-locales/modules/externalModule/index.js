/** @type {import('@nuxt/types').Module} */
export default function () {
  const { nuxt } = this

  nuxt.hook('i18n:extend-messages', function (additionalMessages) {
    additionalMessages.push({
      en: {
        'external-module': {
          hello: 'Hello external module'
        }
      },
      fr: {
        'external-module': {
          hello: 'Bonjour module externe'
        }
      }
    })
  })
}

import lang from './lang'

export default function () {
  const { nuxt } = this

  nuxt.hook('i18n:extend-locales', function (additionalMessages) {
    additionalMessages.push(lang)
  })
}

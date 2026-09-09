import { getRequestURL } from 'h3'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('i18n:request-config', (event, config) => {
    // only hosts under `ja.` serve Japanese, elsewhere `/ja` 404s
    if (!getRequestURL(event, { xForwardedHost: true }).host.startsWith('ja.')) {
      config.locales = config.locales.filter(locale => (typeof locale === 'string' ? locale : locale.code) !== 'ja')
    }
  })
})

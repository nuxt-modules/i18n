import { defineNitroPlugin } from 'nitropack/runtime'
import { getRequestURL } from 'h3'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('i18n:request-config', (event, config) => {
    const host = getRequestURL(event, { xForwardedHost: true }).host
    const code = (locale: (typeof config.locales)[number]) => (typeof locale === 'string' ? locale : locale.code)

    // hosts under `restricted.` do not serve `fr`
    if (host.startsWith('restricted.')) {
      config.locales = config.locales.filter(locale => code(locale) !== 'fr')
    }

    // a locale the build does not know, which the module drops
    if (host.startsWith('unknown.')) {
      config.locales = [...config.locales, 'de']
    }
  })
})

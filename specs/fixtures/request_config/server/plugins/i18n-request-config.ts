import { defineNitroPlugin } from 'nitropack/runtime'
import { getRequestURL } from 'h3'

/**
 * Narrows the locales served to the request: hosts under `restricted.` do not serve `fr`.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('i18n:request-config', (event, config) => {
    const host = getRequestURL(event, { xForwardedHost: true }).host
    if (host.startsWith('restricted.')) {
      config.locales = (config.locales as { code: string }[]).filter(l => l.code !== 'fr') as typeof config.locales
    }
  })
})

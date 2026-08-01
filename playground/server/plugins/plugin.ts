export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('i18n:request-config', (ctx, config) => {
    console.log(config)
    config.locales = config.locales.filter((locale) => locale.code !== 'ja')
    config.locales.push({ code: 'fr', language: 'fr-FR', file: 'fr.json', name: 'French', domain: '' })
  })
})
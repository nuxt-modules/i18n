import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'

// This runtime config usage combined with `differentDomains` originally triggered #3400
export default defineNitroPlugin(nitroApp => {
  const runtimeConfig = useRuntimeConfig()

  nitroApp.hooks.hook('request', event => {
    event.context.nitro = event.context.nitro ?? {}
    event.context.nitro.runtimeConfig = runtimeConfig
  })
})

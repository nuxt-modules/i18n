import type { Nuxt } from '@nuxt/schema'
import type { I18nNuxtContext } from '../context'
import { addVitePlugin, useNitro } from '@nuxt/kit'

export function prepareHMR(ctx: I18nNuxtContext, nuxt: Nuxt) {
  if (!nuxt.options.dev || !ctx.options.hmr) { return }
  addVitePlugin({
    name: 'i18n:options-hmr',
    configureServer(server) {
      const reloadClient = () => server.ws.send({ type: 'full-reload' })

      server.ws.on('i18n:options-complex-invalidation', () => {
        // await dev reload if type generation is enabled
        if (ctx.options.experimental.typedOptionsAndMessages) {
          useNitro().hooks.hookOnce('dev:reload', reloadClient)
          return
        }

        reloadClient()
      })
    },
  })
}

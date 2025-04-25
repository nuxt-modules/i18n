import { vueI18nConfigs, localeLoaders } from '#internal/i18n/options.mjs'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { localeDetector as _localeDetector } from '#internal/i18n/locale.detector.mjs'
import { loadVueI18nOptions, loadAndSetLocaleMessages } from '../messages'
// @ts-expect-error virtual file
import { appId } from '#internal/nuxt.config.mjs'
import { deepCopy } from '@intlify/shared'
import { stringify } from 'devalue'

import type { H3Event } from 'h3'
import type { I18nOptions } from 'vue-i18n'

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export default defineNitroPlugin(async nitro => {
  const messages = {}
  const vueI18nConfig: I18nOptions = await loadVueI18nOptions(vueI18nConfigs)

  deepCopy(vueI18nConfig.messages, messages)

  const loaderPromises: Promise<void>[] = []
  for (const locale in localeLoaders) {
    loaderPromises.push(loadAndSetLocaleMessages(locale, localeLoaders, messages))
  }

  await Promise.all(loaderPromises)

  nitro.hooks.hook('request', async (event: H3Event) => {
    // @ts-expect-error mismatching types
    event.context.i18n ??= {}
    // @ts-expect-error mismatching types
    event.context.i18n.messages = messages
  })

  nitro.hooks.hook('render:html', htmlContext => {
    try {
      htmlContext.bodyAppend.unshift(
        `<script type="application/json" data-nuxt-i18n="${appId}">${stringify(messages)}</script>`
      )
    } catch (_) {}
  })
})

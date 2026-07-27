import { parse } from 'devalue'
import { unref } from 'vue'
import { defineNuxtPlugin, useNuxtApp } from '#app'
import { localeCodes, localeLoaders } from '#build/i18n-options.mjs'
import { getLocaleMessagesMergedCached } from '../shared/messages'
import { type NuxtI18nContext, useNuxtI18nContext } from '../context'

import type { Composer, DefineLocaleMessage, LocaleMessages, VueI18n } from 'vue-i18n'

export default defineNuxtPlugin({
  name: 'i18n:plugin:preload',
  dependsOn: ['i18n:plugin'],
  async setup(_nuxt) {
    if (!__I18N_PRELOAD__) { return }
    // @ts-expect-error untyped internal id parameter
    const nuxt = useNuxtApp(_nuxt._id)
    const ctx = useNuxtI18nContext(nuxt)

    if (import.meta.server) {
      // loadMessages dispatches per locale between the endpoint (read directly, no `$fetch`
      // round-trip) and runtime loaders, and installs shared trees instead of copying
      for (const locale of localeCodes) {
        await ctx.loadMessages(locale)
      }

      ctx.preloaded = true

      const serverI18n = nuxt.ssrContext?.event.context.nuxtI18n
      // set server context messages
      if (serverI18n) {
        const msg = unref(ctx.vueI18n.global.messages) as LocaleMessages<DefineLocaleMessage>
        serverI18n.messages ??= {}
        for (const k in msg) {
          serverI18n.messages[k] = msg[k]!
        }
      }
    }

    if (import.meta.client) {
      await mergePayloadMessages(ctx, ctx.vueI18n.global, nuxt)

      /**
       * Ensure complete messages are loaded before switching page for the first time
       * in case preloaded messages are a subset due to unused key stripping
       */
      if (ctx.preloaded && __I18N_STRIP_UNUSED__) {
        const unsub = nuxt.$router.beforeResolve(async (to, from) => {
          if (to.path === from.path) { return }
          await ctx.loadMessages(ctx.getLocale())
          unsub()
        })
      }
    }
  },
})

/**
 * Merge preloaded messages from serialized messages payload
 */
async function mergePayloadMessages(ctx: NuxtI18nContext, i18n: Composer | VueI18n, nuxt = useNuxtApp()) {
  const content = document.querySelector(`[data-nuxt-i18n="${nuxt._id}"]`)?.textContent

  const preloadedMessages: LocaleMessages<DefineLocaleMessage> = content && parse(content)
  const preloadedKeys = Object.keys(preloadedMessages || {})

  if (!preloadedKeys.length) { return }

  for (const locale of preloadedKeys) {
    if (ctx.usesRuntimeLoaders(locale)) { continue }
    const messages = preloadedMessages[locale]
    if (messages) {
      i18n.mergeLocaleMessage(locale, messages)
    }
  }

  // the payload of a locale behind runtime loaders holds whatever the build resolved, so its
  // messages are loaded again here - one failing locale should not discard the others
  const reloaded = preloadedKeys.filter(locale => ctx.usesRuntimeLoaders(locale))
  const results = await Promise.allSettled(reloaded.map(x => getLocaleMessagesMergedCached(x, localeLoaders[x])))
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      i18n.mergeLocaleMessage(reloaded[i]!, result.value)
    } else {
      console.warn(`Failed to load messages for locale "${reloaded[i]}"`, result.reason)
    }
  })

  ctx.preloaded = true
}

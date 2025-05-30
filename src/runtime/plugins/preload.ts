import { parse } from 'devalue'
import { unref } from 'vue'
import { useNuxtApp, defineNuxtPlugin } from '#app'
import { localeCodes, localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from '../shared/messages'
import { useNuxtI18nContext, type NuxtI18nContext } from '../context'

import type { Composer, VueI18n } from 'vue-i18n'
import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

export default defineNuxtPlugin({
  name: 'i18n:plugin:preload',
  dependsOn: ['i18n:plugin'],
  async setup() {
    if (!__I18N_PRELOAD__) return
    const nuxt = useNuxtApp()
    const ctx = useNuxtI18nContext()

    if (import.meta.server) {
      for (const locale of localeCodes) {
        try {
          const messages = await $fetch(`/_i18n/${locale}/messages.json`)
          for (const locale of Object.keys(messages)) {
            nuxt.$i18n.mergeLocaleMessage(locale, messages[locale])
          }
        } catch (e) {
          console.log('Error loading messages', e)
        }
      }

      ctx.preloaded = true

      const serverI18n = nuxt.ssrContext?.event.context.nuxtI18n
      // set server context messages
      if (serverI18n) {
        const msg = unref(ctx.vueI18n.global.messages) as LocaleMessages<DefineLocaleMessage>
        serverI18n.messages ??= {}
        for (const k in msg) {
          serverI18n.messages[k] = msg[k]
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
          if (to.path === from.path) return
          await ctx.loadMessages(ctx.getLocale())
          unsub()
        })
      }
    }
  }
})

/**
 * Merge preloaded messages from serialized messages payload
 */
async function mergePayloadMessages(ctx: NuxtI18nContext, i18n: Composer | VueI18n, nuxt = useNuxtApp()) {
  const content = document.querySelector(`[data-nuxt-i18n="${nuxt._id}"]`)?.textContent
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const preloadedMessages: LocaleMessages<DefineLocaleMessage> = content && parse(content)
  const preloadedKeys = Object.keys(preloadedMessages || {})

  if (preloadedKeys.length) {
    if (ctx.dynamicResourcesSSG) {
      const getKeyedLocaleMessages = async (locale: string) => {
        return { [locale]: await getLocaleMessagesMergedCached(locale, localeLoaders[locale]) }
      }

      try {
        const msg = await Promise.all(preloadedKeys.map(getKeyedLocaleMessages))
        for (const m of msg) {
          for (const k in m) {
            i18n.mergeLocaleMessage(k, m[k])
          }
        }
      } catch (e) {
        console.log('Error loading messages', e)
      }
      ctx.preloaded = true
    } else {
      for (const locale of preloadedKeys) {
        const messages = preloadedMessages[locale]
        if (messages) {
          i18n.mergeLocaleMessage(locale, messages)
        }
      }
      ctx.preloaded = true
    }
  }
}

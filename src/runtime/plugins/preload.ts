import { parse } from 'devalue'
import { unref } from 'vue'
import { useNuxtApp, defineNuxtPlugin, type NuxtApp } from '#app'
import { localeCodes, localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from '../shared/messages'

import type { Composer, VueI18n } from 'vue-i18n'
import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'

export default defineNuxtPlugin({
  name: 'i18n:plugin:preload',
  dependsOn: ['i18n:plugin'],
  async setup() {
    const nuxt = useNuxtApp()
    const i18n = nuxt._vueI18n

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

      nuxt._nuxtI18nCtx.preloaded = true

      const serverI18n = nuxt.ssrContext?.event.context.nuxtI18n
      // set server context messages
      if (serverI18n) {
        const msg = unref(nuxt._vueI18n.global.messages) as LocaleMessages<DefineLocaleMessage>
        serverI18n.messages ??= {}
        for (const k in msg) {
          serverI18n.messages[k] = msg[k]
        }
      }
    }

    if (import.meta.client) {
      await mergePayloadMessages(nuxt._nuxtI18nCtx, i18n.global, nuxt)

      /**
       * Ensure complete messages are loaded before switching page for the first time
       * in case preloaded messages are a subset due to unused key stripping
       */
      if (nuxt._nuxtI18nCtx.preloaded && __I18N_STRIP_UNUSED__) {
        const unsub = nuxt.$router.beforeResolve(async (to, from) => {
          if (to.path === from.path) return
          await nuxt._nuxtI18nCtx.loadLocaleMessages(nuxt._nuxtI18n.getLocale())
          unsub()
        })
      }
    }
  }
})

/**
 * Merge preloaded messages from serialized messages payload
 */
async function mergePayloadMessages(
  nuxtI18nCtx: NuxtApp['_nuxtI18nCtx'],
  i18n: Composer | VueI18n,
  nuxt = useNuxtApp()
) {
  const content = document.querySelector(`[data-nuxt-i18n="${nuxt._id}"]`)?.textContent
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const preloadedMessages: LocaleMessages<DefineLocaleMessage> = content && parse(content)
  const preloadedKeys = Object.keys(preloadedMessages || {})

  if (preloadedKeys.length) {
    if (nuxtI18nCtx.dynamicResourcesSSG) {
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
      nuxtI18nCtx.preloaded = true
    } else {
      for (const locale of preloadedKeys) {
        const messages = preloadedMessages[locale]
        if (messages) {
          i18n.mergeLocaleMessage(locale, messages)
        }
      }
      nuxtI18nCtx.preloaded = true
    }
  }
}

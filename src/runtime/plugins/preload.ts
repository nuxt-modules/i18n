import { parse } from 'devalue'
import { deepCopy } from '@intlify/shared'
import { useNuxtApp, defineNuxtPlugin, type NuxtApp } from '#app'
import { localeCodes, localeLoaders } from '#build/i18n.options.mjs'
import { getLocaleMessagesMergedCached } from '../shared/messages'

import type { TranslateOptions, Composer } from 'vue-i18n'
import type { LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import { unref } from 'vue'
import type { H3EventContext } from 'h3'
import type { ComposableContext } from '../utils'

export default defineNuxtPlugin({
  name: 'i18n:plugin:preload',
  dependsOn: ['i18n:plugin'],
  async setup() {
    const nuxt = useNuxtApp()
    const i18n = nuxt._vueI18n

    // retrieve loaded messages from server-side if enabled
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
        // wrap translation functions to track translation keys used during SSR
        if (__I18N_STRIP_UNUSED__) {
          wrapTranslationFunctions(i18n.global as Composer, nuxt._nuxtI18n, serverI18n)
        }

        const msg = unref(i18n.global.messages) as LocaleMessages<DefineLocaleMessage>
        serverI18n.messages ??= {}
        for (const k in msg) {
          serverI18n.messages[k] = msg[k]
        }
      }
    }

    if (import.meta.client) {
      await mergePayloadMessages(nuxt._nuxtI18nCtx, i18n.global as Composer, nuxt)

      /**
       * Ensure messages are loaded before switching page for the first time
       */
      const unsub = nuxt.$router.beforeResolve(async (to, from) => {
        if (to.path === from.path) return
        await nuxt._nuxtI18nCtx.loadLocaleMessages(nuxt._nuxtI18n.getLocale())
        unsub()
      })
    }
  }
})

function wrapTranslationFunctions(i18n: Composer, ctx: ComposableContext, serverI18n: H3EventContext['nuxtI18n']) {
  const originalT = i18n.t.bind(i18n)
  type TParams = Parameters<typeof originalT>
  i18n.t = (
    key: string,
    listOrNamed?: string | number | unknown[] | Record<string, unknown>,
    opts?: TranslateOptions<string> | number | string
  ) => {
    const locale = ((typeof opts === 'object' && opts?.locale) || ctx.getLocale()) as string
    serverI18n?.trackKey(key, locale)
    // @ts-expect-error type mismatch
    return originalT(key, listOrNamed as TParams[1], opts)
  }

  const originalTe = i18n.te.bind(i18n)
  i18n.te = (key, locale) => {
    serverI18n?.trackKey(key, locale || ctx.getLocale())
    return originalTe(key, locale)
  }

  const originalTm = i18n.tm.bind(i18n)
  i18n.tm = key => {
    serverI18n?.trackKey(key, ctx.getLocale())
    return originalTm(key)
  }
}

async function mergePayloadMessages(nuxtI18nCtx: NuxtApp['_nuxtI18nCtx'], i18n: Composer, nuxt = useNuxtApp()) {
  const content = document.querySelector(`[data-nuxt-i18n="${nuxt._id}"]`)?.textContent
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const preloadedMessages: LocaleMessages<DefineLocaleMessage> = content && parse(content)

  const preloadedKeys = Object.keys(preloadedMessages || {})
  if (preloadedMessages && preloadedKeys.length && nuxtI18nCtx.dynamicResourcesSSG) {
    try {
      const msg = await Promise.all(
        preloadedKeys.map(async locale => {
          const m = await getLocaleMessagesMergedCached(locale, localeLoaders[locale])
          return { [locale]: m }
        })
      )
      for (const m of msg) {
        deepCopy(m, i18n.messages)
      }
      nuxtI18nCtx.preloaded = true
    } catch (e) {
      console.log('Error loading messages', e)
    }
  }
}

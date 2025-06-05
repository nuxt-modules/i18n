import { vueI18nConfigs } from '#build/i18n.options.mjs'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { getComposer } from '../compatibility'
import { useNuxtI18nContext } from '../context'
import { loadVueI18nOptions } from '../shared/messages'

import type { I18nOptions } from 'vue-i18n'

declare module '../context' {
  interface NuxtI18nContext {
    dev?: {
      resetI18nProperties: (locale?: string) => Promise<void>
      deepEqual: typeof deepEqual
    }
  }
}

export default defineNuxtPlugin({
  name: 'i18n:dev',
  dependsOn: ['i18n:plugin'],
  setup() {
    if (!import.meta.dev) return
    const nuxt = useNuxtApp()
    const ctx = useNuxtI18nContext(nuxt)
    const composer = getComposer(ctx.vueI18n)

    /**
     * Reload vue-i18n configs and locale message files in the correct order
     *
     * @param locale only passed when a locale file has been changed, if `undefined` indicates a vue-i18n config change
     */
    async function resetI18nProperties(locale?: string) {
      const opts: I18nOptions = await loadVueI18nOptions(vueI18nConfigs)

      const messageLocales = uniqueKeys(opts.messages!, composer.messages.value)
      for (const k of messageLocales) {
        if (locale && k !== locale) continue

        // set to vue-i18n messages or reset to account for removed messages
        composer.setLocaleMessage(k, opts?.messages?.[k] ?? {})
        await ctx.loadMessages(k)
      }

      // skip vue-i18n config properties if locale is passed (locale file HMR)
      if (locale != null) return

      const numberFormatLocales = uniqueKeys(opts.numberFormats || {}, composer.numberFormats.value)
      for (const k of numberFormatLocales) {
        composer.setNumberFormat(k, opts.numberFormats?.[k] || {})
      }

      const datetimeFormatsLocales = uniqueKeys(opts.datetimeFormats || {}, composer.datetimeFormats.value)
      for (const k of datetimeFormatsLocales) {
        composer.setDateTimeFormat(k, opts.datetimeFormats?.[k] || {})
      }
    }

    nuxt._nuxtI18nCtx.dev = {
      resetI18nProperties,
      deepEqual
    }
  }
})

// collect unique keys of passed objects
function uniqueKeys(...objects: Array<Record<string, unknown>>): string[] {
  const keySet = new Set<string>()

  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      keySet.add(key)
    }
  }

  return Array.from(keySet)
}

// helper function to compare old and new vue-i18n configs
function deepEqual<T extends Record<string, unknown>, K extends keyof T>(a: T, b: T, ignoreKeys: K[] = []) {
  if (a === b) return true
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false

  // top-level keys excluding ignoreKeys
  const keysA = Object.keys(a).filter(k => !ignoreKeys.includes(k as K))
  const keysB = Object.keys(b).filter(k => !ignoreKeys.includes(k as K))

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    const valA = a[key]
    const valB = b[key]
    // compare functions stringified
    if (typeof valA === 'function' && typeof valB === 'function') {
      if (valA.toString() !== valB.toString()) {
        return false
      }
    }
    // nested recursive check (no ignoring at deeper levels)
    else if (typeof valA === 'object' && typeof valB === 'object') {
      if (!deepEqual(valA as unknown as T, valB as unknown as T)) {
        return false
      }
    }
    // primitive value check
    else if (valA !== valB) {
      return false
    }
  }
  return true
}

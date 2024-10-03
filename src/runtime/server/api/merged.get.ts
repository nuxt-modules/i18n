import { deepCopy } from '@intlify/shared'
// @ts-ignore
import { defineEventHandler } from '#imports'
import { vueI18nConfigs, localeLoaders } from '#internal/i18n/options.mjs'

import type { I18nOptions } from 'vue-i18n'

export default defineEventHandler(async () => {
  const messages = {}
  const dateFormats = {}
  const numberFormats = {}

  for (const config of vueI18nConfigs) {
    const intermediate = await (await config)()
    const res = ('default' in intermediate ? intermediate.default : intermediate)() as I18nOptions | undefined

    if (res == null) continue

    for (const v of Object.values(res.messages ?? [])) {
      deepCopy(v, messages)
    }
    for (const v of Object.values(res.numberFormats ?? [])) {
      deepCopy(v, numberFormats)
    }
    for (const v of Object.values(res.datetimeFormats ?? [])) {
      deepCopy(v, dateFormats)
    }
  }

  // @ts-ignore
  const _defineI18nLocale = globalThis.defineI18nLocale

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  globalThis.defineI18nLocale = val => val

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  // globalThis.defineI18nConfig = val => val

  for (const code in localeLoaders) {
    for (const f of localeLoaders[code]) {
      let message
      const getter = await f.load().then(r => ('default' in r ? r.default : r))
      if (typeof getter === 'function') {
        message = await getter(code)
      } else {
        message = getter
      }

      try {
        deepCopy(message, messages)
      } catch (err) {
        console.log(err)
      }
    }
    // we could only check one locale's files (serving as master/template) for speed
    // break
  }

  // @ts-ignore
  globalThis.defineI18nLocale = _defineI18nLocale

  return {
    messages,
    numberFormats,
    dateFormats
  }
})

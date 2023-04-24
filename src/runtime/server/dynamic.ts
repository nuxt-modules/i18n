import { defineEventHandler, setResponseHeader, createError } from 'h3'
// @ts-expect-error
import { useStorage } from '#imports'
import { relative, join } from 'pathe'
import { isObject, isFunction } from '@intlify/shared'

import type { I18nOptions, DefineLocaleMessage, LocaleMessages } from 'vue-i18n'
import type { PrerenderTarget } from '../../utils'

type ResourceMapValue = Pick<PrerenderTarget, 'type' | 'path'> & { locale?: string }

export default defineEventHandler(async event => {
  const hash = event.context.params?.hash
  if (hash == null) {
    throw createError({ statusMessage: `require the 'hash'`, statusCode: 400 })
  }

  const i18nMeta = await getI18nMeta()
  const [filename] = hash.split('.') // request from `xxx.js`
  const target = i18nMeta[filename]

  const loadPath = await resolveModule(target.path)
  const loader = await import(loadPath).then(m => m.default || m)

  if (target.type === 'locale') {
    if (target.locale == null) {
      throw createError({ statusMessage: `not found locale`, statusCode: 500 })
    }
    const resource = await loader(event, target.locale)
    const code = await precompileLocale(target.locale, filename, resource)
    await setResponseHeader(event, 'content-type', 'text/javascript')
    return code
  } else if (target.type === 'config') {
    const config = (isFunction(loader) ? await loader(event) : isObject(loader) ? loader : {}) as I18nOptions
    const code = await precompileConfig(filename, config.messages as NonNullable<I18nOptions['messages']>)
    await setResponseHeader(event, 'content-type', 'text/javascript')
    return code
  } else {
    throw new Error('Invalid type')
  }
})

async function getI18nMeta() {
  return (await useStorage().getItem('build:dist:server:i18n-meta.json')) as Record<string, ResourceMapValue>
}

async function resolveModule(path: string) {
  const storage = await useStorage()
  const rootMount = await storage.getMount('root')
  const root = rootMount.driver.options.base
  const rootRelative = relative(new URL(import.meta.url).pathname, root)
  return join(rootRelative, 'dist/server', path)
}

async function precompileLocale(locale: string, filename: string, messages: LocaleMessages<DefineLocaleMessage>) {
  return await $fetch('/__i18n__/precompile', {
    method: 'POST',
    body: {
      locale,
      type: 'locale',
      hash: filename,
      resource: messages
    }
  })
}

async function precompileConfig(filename: string, messages: NonNullable<I18nOptions['messages']>) {
  return await $fetch('/__i18n__/precompile', {
    method: 'POST',
    body: {
      type: 'config',
      hash: filename,
      resource: getNeedPrecompileMessages(messages)
    }
  })
}

/**
 * TODO:
 *  We should use externalized logic. This logic is also used in `runtime/internal.ts.`
 *  It's difficult make it common between runtime/client side and runtime/server side on nuxt module.
 *  (we know use monorepo packages...)
 */

function deepCopy(src: Record<string, any>, des: Record<string, any>, predicate?: (src: any, des: any) => boolean) {
  for (const key in src) {
    if (isObject(src[key])) {
      if (!isObject(des[key])) des[key] = {}
      deepCopy(src[key], des[key], predicate)
    } else {
      if (predicate) {
        if (predicate(src[key], des[key])) {
          des[key] = src[key]
        }
      } else {
        des[key] = src[key]
      }
    }
  }
}

export function getNeedPrecompileMessages(messages: NonNullable<I18nOptions['messages']>) {
  const needPrecompileMessages: NonNullable<I18nOptions['messages']> = {}
  // ignore, if messages will have function
  const predicate = (src: any) => !isFunction(src)

  for (const [locale, message] of Object.entries(messages)) {
    const dest = (needPrecompileMessages[locale] = {})
    deepCopy(message, dest, predicate)
  }
  return needPrecompileMessages
}

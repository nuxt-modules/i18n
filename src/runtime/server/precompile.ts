import { defineEventHandler, readBody, setResponseHeader, createError } from 'h3'
import { generateJSON } from '@intlify/bundle-utils'
import { prefixStorage } from 'unstorage'
// @ts-ignore TODO: fix resolve
import { useStorage, useRuntimeConfig } from '#imports'

import type { Locale } from 'vue-i18n'

const BASE_KEY = 'i18n' as const
const CONFIG_KEY = 'config' as const
const configStorage = prefixStorage(useStorage(), BASE_KEY)

const PRECOMPILED_LOCALE_KEY = 'i18n:locales' as const
const localeStorage = prefixStorage(useStorage(), PRECOMPILED_LOCALE_KEY)

const resolveKey = (key: string) => `${key}.js`
const localeKey = (locale: string, hash: string) => `${locale}-${hash}`
const configKey = (hash: string) => `${CONFIG_KEY}-${hash}`

type I18nBody = {
  type: 'locale' | 'config'
  locale: Locale
  hash: string
  resource: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default defineEventHandler(async event => {
  const body = await readBody<{
    type: 'locale' | 'config'
    locale: Locale
    hash: string
    resource: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  }>(event)

  validate(body)

  const cacheCode = await getCacheCode(body)
  if (cacheCode) {
    await setResponseHeader(event, 'content-type', 'text/javascript')
    return cacheCode.toString()
  }

  const [code, errors] = generateCode(body)
  if (errors.length > 0) {
    throw createError({ statusMessage: errors.join('|'), statusCode: 400 })
  }

  await setCacheCode(code, body)

  await setResponseHeader(event, 'content-type', 'text/javascript')
  return code
})

function validate(body: I18nBody) {
  if (!body.type) {
    throw createError({ statusMessage: `require the 'type'`, statusCode: 400 })
  }

  if (body.type === 'locale') {
    if (!body.locale) {
      throw createError({ statusMessage: `require the 'locale'`, statusCode: 400 })
    }
  }

  if (!body.hash) {
    throw createError({ statusMessage: `require the 'hash'`, statusCode: 400 })
  }

  if (!body.resource) {
    throw createError({ statusMessage: `require the 'resource'`, statusCode: 400 })
  }
}

async function getCacheCode({ type, locale, hash }: I18nBody) {
  if (type === 'locale') {
    return await localeStorage.getItem(resolveKey(localeKey(locale, hash)))
  } else if (type === 'config') {
    return await configStorage.getItem(resolveKey(configKey(hash)))
  } else {
    return null
  }
}

function generateCode(body: I18nBody): [string, string[]] {
  const errors = [] as string[]
  const {
    i18n: {
      precompile: { strictMessage, escapeHtml }
    }
  } = useRuntimeConfig()
  const env = process.dev ? 'development' : 'production'

  let gen = ''
  if (body.type === 'locale') {
    const { code } = generateJSON(JSON.stringify(body.resource), {
      env,
      strictMessage,
      escapeHtml,
      onError: error => {
        errors.push(error)
      }
    })
    gen = code
  } else if (body.type === 'config') {
    gen += `export default {\n`
    const codes = [] as string[]
    Object.keys(body.resource).reduce((codes, key) => {
      const { code } = generateJSON(JSON.stringify(body.resource[key]), {
        type: 'bare',
        env,
        strictMessage,
        escapeHtml,
        onError: error => {
          errors.push(error)
        }
      })
      codes.push(`  ${JSON.stringify(key)}: ${code},\n`)
      return codes
    }, codes)
    gen += codes.join('')
    gen += `}\n`
  }

  return [gen, errors]
}

async function setCacheCode(code: string, { type, locale, hash }: I18nBody) {
  if (type === 'locale') {
    await localeStorage.setItem(resolveKey(localeKey(locale, hash)), code)
  } else if (type === 'config') {
    await configStorage.setItem(resolveKey(configKey(hash)), code)
  }
}

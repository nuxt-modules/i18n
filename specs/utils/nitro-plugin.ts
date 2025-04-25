import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { snakeCase } from 'scule'

function flattenObject(obj: Record<string, unknown> = {}) {
  const flattened: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const entry = obj[key]

    if (typeof entry !== 'object' || entry == null) {
      flattened[key] = obj[key]
      continue
    }

    const flatObject = flattenObject(entry as Record<string, unknown>)
    for (const x of Object.keys(flatObject)) {
      flattened[key + '_' + x] = flatObject[x]
    }
  }

  return flattened
}

export function convertObjectToConfig(obj: Record<string, unknown>) {
  const makeEnvKey = (str: string) => `NUXT_${snakeCase(str).toUpperCase()}`

  const env: Record<string, unknown> = {}
  const flattened = flattenObject(obj)
  for (const key in flattened) {
    env[makeEnvKey(key)] = flattened[key]
  }

  return env
}

export default defineNitroPlugin(async nitroApp => {
  const config = useRuntimeConfig()
  const tempKeys = new Set<string>()

  const handler = (msg: { type: string; value: Record<string, string> }) => {
    if (msg.type !== 'update:runtime-config') return

    // cleanup temporary keys
    for (const k of tempKeys) {
      delete process.env[k]
    }

    // flatten object and use env variable keys
    const envConfig = convertObjectToConfig(msg.value)
    for (const [k, val] of Object.entries(envConfig)) {
      // collect keys which are newly introduced to cleanup later
      if (k in process.env === false) {
        tempKeys.add(k)
      }

      // @ts-expect-error untyped
      process.env[k] = val
    }

    process.send!({ type: 'confirm:runtime-config', value: config }, undefined, {
      keepOpen: true
    })
  }

  process.on('message', handler)

  nitroApp.hooks.hook('close', () => process.off('message', handler))
})

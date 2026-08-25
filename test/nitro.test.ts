import { describe, expect, test } from 'vitest'
import { generateH3RuntimeTemplate, generateNitroRuntimeTemplate } from '../src/nitro'

describe('generateH3RuntimeTemplate', () => {
  test('uses the installed H3 package before Nuxt 5', () => {
    expect(generateH3RuntimeTemplate('4.5.1')).toContain(`from 'h3'`)
  })

  test('uses Nitro H3 exports with Nuxt 5', () => {
    expect(generateH3RuntimeTemplate('5.0.0-29745766.482f3357')).toContain(`from 'nitro/h3'`)
  })
})

describe('generateNitroRuntimeTemplate', () => {
  test('uses Nitro 2 runtime exports before Nuxt 5', () => {
    const template = generateNitroRuntimeTemplate('4.5.1')

    expect(template).toContain(`from 'nitropack/runtime'`)
    expect(template).toContain(`hook('render:before', handler)`)
    expect(template).toContain(`context.response = { body, headers, statusCode: status }`)
  })

  test('uses Nitro 3 runtime exports with Nuxt 5', () => {
    const template = generateNitroRuntimeTemplate('5.0.0-29745766.482f3357')

    expect(template).toContain(`definePlugin as defineNitroPlugin`)
    expect(template).toContain(`defineCachedHandler as defineCachedEventHandler`)
    expect(template).toContain(`from 'nitro/runtime-config'`)
    expect(template).toContain(`from 'nitro/storage'`)
    expect(template).toContain(`from 'nitro/h3'`)
    expect(template).toContain(`hook('render:route'`)
    expect(template).toContain(`setNitroRedirectResponse = () => {}`)
    expect(template).not.toContain('nitropack/runtime')
    expect(template).not.toContain('context.response')
  })
})

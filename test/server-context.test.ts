import { beforeEach, describe, expect, test, vi } from 'vitest'

const getMergedMessages = vi.fn()

vi.mock('../src/runtime/server/utils/messages', () => ({ getMergedMessages }))
// the server runtime adapter imports nitro internals that only resolve in a nitro build
vi.mock('#i18n-server-runtime', () => ({}))

const { createI18nContext } = await import('../src/runtime/server/context')

const cachedCatalogue = () => Object.freeze({ ar: Object.freeze({ HOTELS: 'فندق' }) })

describe('createI18nContext().loadMessages', () => {
  beforeEach(() => {
    getMergedMessages.mockReset()
  })

  test('(#4152) a load leaves the preload payload to the preload plugin', async () => {
    const ctx = createI18nContext()
    // the plugin stores the cached tree by reference, which is frozen
    const preloaded = Object.freeze({ HOTELS: 'فندق' })
    ctx.messages.ar = preloaded
    getMergedMessages.mockResolvedValue(cachedCatalogue())

    await ctx.loadMessages('ar')
    await ctx.loadMessages('ku')

    expect(ctx.messages).toEqual({ ar: preloaded })
    expect(ctx.messages.ar).toBe(preloaded)
  })

  test('the caller receives the merged messages', async () => {
    const ctx = createI18nContext()
    getMergedMessages.mockResolvedValue(cachedCatalogue())

    await expect(ctx.loadMessages('ar')).resolves.toEqual({ ar: { HOTELS: 'فندق' } })
  })
})

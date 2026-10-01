import { beforeEach, describe, expect, test, vi } from 'vitest'

const getMergedMessages = vi.fn()

vi.mock('../src/runtime/server/utils/messages', () => ({ getMergedMessages }))

const { createI18nContext } = await import('../src/runtime/server/context')

const cachedCatalogue = () => Object.freeze({ ar: Object.freeze({ HOTELS: 'فندق' }) })

describe('createI18nContext().loadMessages', () => {
  beforeEach(() => {
    vi.stubGlobal('__I18N_PRELOAD__', true)
    getMergedMessages.mockReset()
  })

  test('(#4152) a load after the preload pass leaves its frozen entry untouched', async () => {
    const ctx = createI18nContext()
    ctx.messages.ar = Object.freeze({ HOTELS: 'فندق', FROM_VUE_I18N_CONFIG: 'اعداد' })
    getMergedMessages.mockResolvedValue(cachedCatalogue())

    await expect(ctx.loadMessages('ar')).resolves.toBeDefined()

    expect(ctx.messages.ar).toEqual({ HOTELS: 'فندق', FROM_VUE_I18N_CONFIG: 'اعداد' })
  })

  test('a locale reached through a fallback chain lands once', async () => {
    const ctx = createI18nContext()
    getMergedMessages.mockResolvedValue(Object.freeze({
      ar: Object.freeze({ HOTELS: 'فندق' }),
      ku: Object.freeze({ HOTELS: 'ھۆتێل' }),
    }))

    await ctx.loadMessages('ku')
    await ctx.loadMessages('ar')

    expect(ctx.messages).toEqual({ ar: { HOTELS: 'فندق' }, ku: { HOTELS: 'ھۆتێل' } })
  })

  test('the caller still receives the merged messages', async () => {
    const ctx = createI18nContext()
    getMergedMessages.mockResolvedValue(cachedCatalogue())

    await expect(ctx.loadMessages('ar')).resolves.toEqual({ ar: { HOTELS: 'فندق' } })
  })

  test('no payload is collected when preload is off', async () => {
    vi.stubGlobal('__I18N_PRELOAD__', false)
    const ctx = createI18nContext()
    getMergedMessages.mockResolvedValue(cachedCatalogue())

    await ctx.loadMessages('ar')

    expect(ctx.messages).toEqual({})
  })
})

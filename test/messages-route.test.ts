import { beforeEach, expect, test, vi } from 'vitest'

// nitro turns a cache handler's `maxAge` into an `EX <ttl>` on the storage write, and a redis driver
// rejects a non-positive expiry, so mimic a cached handler that writes with `ttl: maxAge` and a store
// that throws like redis does on an invalid ttl
const { writes, ctx } = vi.hoisted(() => ({
  writes: [] as number[],
  ctx: {
    loadMessages: vi.fn(async (locale: string) => ({ [locale]: { hello: 'world' } })),
    localeConfigs: { en: { cacheable: true } } as Record<string, { cacheable: boolean }>,
  },
}))

vi.mock('nitropack/runtime', () => {
  const cached = (fn: (...args: unknown[]) => unknown, opts: any) => async (...args: unknown[]) => {
    if (await opts.shouldBypassCache?.(...args)) {
      return fn(...args)
    }
    const value = await fn(...args)
    if (opts.maxAge && opts.swr === false) {
      if (opts.maxAge <= 0) {
        throw new Error('ERR invalid expire time in set')
      }
      writes.push(opts.maxAge)
    }
    return value
  }
  return { defineCachedFunction: cached, defineCachedEventHandler: cached }
})

vi.mock('../src/runtime/server/context', () => ({
  useI18nContext: () => ctx,
  tryUseI18nContext: () => ctx,
  initializeI18nContext: async () => ctx,
}))
vi.mock('../src/runtime/shared/messages', () => ({ warnMissedMessageFunctions: () => {} }))

async function importMessagesHandler() {
  return (await import('../src/runtime/server/routes/messages')).default
}

function createEvent() {
  return { context: { params: { locale: 'en' } }, node: { req: { headers: {} } }, path: '/_i18n/en/messages.json' }
}

beforeEach(() => {
  vi.resetModules()
  writes.length = 0
  ctx.loadMessages.mockClear()
})

test('serves messages without a cache expiry when caching is disabled', async () => {
  const handler = await importMessagesHandler()

  await expect(handler(createEvent() as never)).resolves.toEqual({ en: { hello: 'world' } })
  expect(writes).toEqual([])
})

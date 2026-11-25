import { expect, test, vi } from 'vitest'

type CacheOptions = { shouldBypassCache: (event: object) => Promise<boolean> }
const options = vi.hoisted(() => ({} as { handler: CacheOptions, function: CacheOptions }))

vi.mock('nitropack/runtime', () => ({
  defineCachedEventHandler: (handler: unknown, opts: CacheOptions) => (options.handler = opts, handler),
  defineCachedFunction: (fn: unknown, opts: CacheOptions) => (options.function = opts, fn),
  useRuntimeConfig: () => ({ public: { i18n: {} } }),
  useStorage: () => ({}),
}))
vi.mock('../src/runtime/server/context', () => ({ tryUseI18nContext: vi.fn(), initializeI18nContext: vi.fn() }))

await import('../src/runtime/server/routes/messages')

// `__I18N_CACHE__` is false in the test setup
test('(#4112) the handler stays out of the nitro cache without the message cache', async () => {
  await expect(options.handler.shouldBypassCache({})).resolves.toBe(true)
  await expect(options.function.shouldBypassCache({})).resolves.toBe(true)
})

import { beforeEach, expect, test, vi } from 'vitest'

type CacheOptions = { shouldBypassCache: (event: object) => Promise<boolean> }
type Handler = (event: object) => unknown
const cache = vi.hoisted(() => ({ options: {} as { handler: CacheOptions, function: CacheOptions }, requests: [] as object[] }))

vi.mock('nitropack/runtime', () => ({
  defineCachedEventHandler: (handler: Handler, opts: CacheOptions) => {
    cache.options.handler = opts
    return (event: object) => (cache.requests.push(event), handler(event))
  },
  defineCachedFunction: (fn: Handler, opts: CacheOptions) => (cache.options.function = opts, fn),
  useRuntimeConfig: () => ({ public: { i18n: {} } }),
  useStorage: () => ({}),
}))
vi.mock('../src/runtime/server/context', () => ({
  tryUseI18nContext: () => ({ localeConfigs: { 'en': {}, 'en-US': {} }, loadMessages: (locale: string) => ({ [locale]: {} }) }),
}))
vi.stubGlobal('__I18N_LOCALE_HASHES__', { 'en': 'abcd1234', 'en-US': 'abcd1234' })

const { default: handler } = await import('../src/runtime/server/routes/messages')

function request(locale: string, hash: string) {
  const headers: Record<string, string> = {}
  const event = { context: { params: { locale, hash } }, node: { res: { setHeader: (name: string, value: string) => (headers[name] = value) } } }
  return { event: event as never, headers }
}

beforeEach(() => {
  cache.requests.length = 0
})

// `__I18N_CACHE__` is false in the test setup
test('(#4112) the handler stays out of the nitro cache without the message cache', async () => {
  await expect(cache.options.handler.shouldBypassCache({})).resolves.toBe(true)
  await expect(cache.options.function.shouldBypassCache({})).resolves.toBe(true)
})

test('a request with the hash of the build goes through the cache', async () => {
  const { event, headers } = request('en', 'abcd1234')

  await expect(handler(event)).resolves.toEqual({ en: {} })
  expect(cache.requests).toEqual([event])
  expect(headers).toEqual({})
})

// the second one joined to the cache key of `en-US` when the request hash was part of the key
test.each(['previous', 'US-abcd1234'])('any other hash is served without being cached (%s)', async (hash) => {
  const { event, headers } = request('en', hash)

  await expect(handler(event)).resolves.toEqual({ en: {} })
  expect(cache.requests).toEqual([])
  expect(headers).toEqual({ 'cache-control': 'no-store' })
})

test.each(['constructor', '__proto__', 'fr'])('a locale that is not configured is not found (%s)', async (locale) => {
  await expect(handler(request(locale, 'abcd1234').event)).rejects.toMatchObject({ statusCode: 404 })
  expect(cache.requests).toEqual([])
})

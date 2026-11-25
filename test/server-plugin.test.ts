import { expect, test, vi } from 'vitest'

const removeItem = vi.hoisted(() => vi.fn())
const getKeys = vi.hoisted(() => vi.fn())
const setupVueI18nOptions = vi.hoisted(() => vi.fn())
const detector = vi.hoisted(() => ({ localeDetector: null as unknown }))

const runtimeConfig = () => ({ public: { i18n: { defaultLocale: 'en', detectBrowserLanguage: false } } })

vi.mock('nitropack/runtime', () => ({
  defineNitroPlugin: (plugin: unknown) => plugin,
  useRuntimeConfig: runtimeConfig,
  useStorage: () => ({ getKeys, removeItem }),
}))
vi.mock('#imports', () => ({ useRuntimeConfig: runtimeConfig }))
vi.mock('#internal/i18n-locale-detector.mjs', () => detector)
vi.mock('../src/runtime/shared/vue-i18n', () => ({ setupVueI18nOptions }))

vi.stubGlobal('__DEFAULT_COOKIE_KEY__', 'i18n_redirected')

async function bootPlugin() {
  const { default: plugin } = await import('../src/runtime/server/plugin')
  const hook = vi.fn()
  // nitro does not await plugins, so neither does this
  plugin({ hooks: { hook } } as never)
  return hook
}

test('registers its hooks while the cache cleanup is pending', async () => {
  getKeys.mockReturnValue(new Promise(() => {}))

  const hook = await bootPlugin()
  await new Promise(resolve => setTimeout(resolve))

  expect(hook.mock.calls.map(([name]) => name)).toEqual(['request', 'render:before', 'render:html'])
})

test('clears the cached message handlers on startup', async () => {
  getKeys.mockResolvedValue(['nitro:handlers:i18n:en.json'])

  await bootPlugin()

  await vi.waitFor(() => expect(removeItem).toHaveBeenCalledWith('nitro:handlers:i18n:en.json'))
  expect(getKeys).toHaveBeenCalledWith('nitro:handlers:i18n')
})

test('clears the cache without waiting for the locale detector options', async () => {
  detector.localeDetector = () => 'en'
  setupVueI18nOptions.mockReturnValue(new Promise(() => {}))
  getKeys.mockResolvedValue(['nitro:handlers:i18n:en.json'])

  await bootPlugin()

  await vi.waitFor(() => expect(removeItem).toHaveBeenCalledWith('nitro:handlers:i18n:en.json'))
})

test('a request arriving before the locale detector options resolve waits for them', async () => {
  detector.localeDetector = () => 'en'
  const { promise, resolve } = Promise.withResolvers<unknown>()
  setupVueI18nOptions.mockReturnValue(promise)

  const hook = await bootPlugin()
  const event = { path: '/en', context: {} as Record<string, unknown> }
  const handlers = hook.mock.calls.filter(([name]) => name === 'request').map(([, handler]) => handler)
  const request = Promise.all(handlers.map(handler => handler(event)))
  resolve({ locale: 'en', fallbackLocale: false, messages: {} })
  await request

  expect(event.context.i18n).toBeDefined()
})

test('a failing cache storage does not fail the plugin', async () => {
  getKeys.mockRejectedValue(new Error('storage unavailable'))

  const hook = await bootPlugin()
  await new Promise(resolve => setTimeout(resolve))

  expect(hook).toHaveBeenCalled()
})

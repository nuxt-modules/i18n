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

async function bootPlugin(hook = vi.fn()) {
  const { default: plugin } = await import('../src/runtime/server/plugin')
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

test('a failing cache storage does not fail the plugin', async () => {
  getKeys.mockRejectedValue(new Error('storage unavailable'))

  const hook = await bootPlugin()
  await new Promise(resolve => setTimeout(resolve))

  expect(hook).toHaveBeenCalled()
})

test('a vue-i18n config fetching from this server does not wait on its own request', async () => {
  detector.localeDetector = () => 'en'
  const hook = vi.fn()
  const loaded = vi.fn()
  setupVueI18nOptions.mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve))
    // an internal `$fetch` runs the request hooks of the server it is called from
    const handlers = hook.mock.calls.filter(([name]) => name === 'request').map(([, handler]) => handler)
    await Promise.all(handlers.map(handler => handler({ path: '/api/messages', context: {} })))
    loaded()
    return { locale: 'en', fallbackLocale: false, messages: {} }
  })

  await bootPlugin(hook)

  await vi.waitFor(() => expect(loaded).toHaveBeenCalled())
})

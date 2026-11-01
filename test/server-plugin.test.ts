import { expect, test, vi } from 'vitest'

const removeItem = vi.hoisted(() => vi.fn())
const getKeys = vi.hoisted(() => vi.fn())

const runtimeConfig = () => ({ public: { i18n: { defaultLocale: 'en', detectBrowserLanguage: false } } })

vi.mock('nitropack/runtime', () => ({
  defineNitroPlugin: (plugin: unknown) => plugin,
  useRuntimeConfig: runtimeConfig,
  useStorage: () => ({ getKeys, removeItem }),
}))
vi.mock('#imports', () => ({ useRuntimeConfig: runtimeConfig }))

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

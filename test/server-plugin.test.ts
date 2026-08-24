import { expect, test, vi } from 'vitest'
import type { H3Event } from 'h3'

const { initializeI18nContext, app } = vi.hoisted(() => ({
  initializeI18nContext: vi.fn(),
  app: { baseURL: '/', buildAssetsDir: '/_nuxt/' },
}))
vi.mock('../src/runtime/server/context', () => ({
  initializeI18nContext,
  tryUseI18nContext: vi.fn(),
  useI18nContext: vi.fn(),
}))
vi.mock('#imports', async importOriginal => ({
  ...(await importOriginal<typeof import('#imports')>()),
  useRuntimeConfig: () => ({ public: { i18n: {} } }),
}))
vi.mock('nitropack/runtime', () => ({
  defineNitroPlugin: (plugin: unknown) => plugin,
  useRuntimeConfig: () => ({ app }),
  useStorage: () => ({ getKeys: () => [], removeItem: () => {} }),
}))

async function setupRequestHook(appOverrides: Partial<typeof app> = {}) {
  Object.assign(app, { baseURL: '/', buildAssetsDir: '/_nuxt/' }, appOverrides)
  const plugin = (await import('../src/runtime/server/plugin')).default
  const hooks: Record<string, (...args: never[]) => unknown> = {}
  await plugin({ hooks: { hook: (name: string, fn: () => unknown) => (hooks[name] = fn) } } as never)
  return hooks['request'] as (event: H3Event) => Promise<void>
}

test('(#4144) does not set up the i18n context for build asset requests', async () => {
  const onRequest = await setupRequestHook()

  await onRequest({ path: '/_nuxt/CzQ8YQCV.js' } as H3Event)

  expect(initializeI18nContext).not.toHaveBeenCalled()
})

test('(#4144) does not set up the i18n context for build assets served under a base URL', async () => {
  const onRequest = await setupRequestHook({ baseURL: '/docs/' })

  await onRequest({ path: '/docs/_nuxt/CzQ8YQCV.js' } as H3Event)

  expect(initializeI18nContext).not.toHaveBeenCalled()
})

test('sets up the i18n context for page requests', async () => {
  const onRequest = await setupRequestHook()

  await onRequest({ path: '/nl/over-ons' } as H3Event)

  expect(initializeI18nContext).toHaveBeenCalledOnce()
})

test('sets up the i18n context when build assets are served from the root', async () => {
  const onRequest = await setupRequestHook({ buildAssetsDir: '/' })

  await onRequest({ path: '/nl/over-ons' } as H3Event)

  expect(initializeI18nContext).toHaveBeenCalledOnce()
})

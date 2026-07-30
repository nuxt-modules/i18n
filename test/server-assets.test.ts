import { beforeEach, expect, test, vi } from 'vitest'

const { getItemRaw, readFile } = vi.hoisted(() => ({ getItemRaw: vi.fn(), readFile: vi.fn() }))
vi.mock('nitropack/runtime', () => ({ useStorage: () => ({ getItemRaw }) }))
vi.mock('node:fs/promises', () => ({ readFile }))

// fresh module per test - the memo is module-scope
async function importReadI18nAsset() {
  return (await import('../src/runtime/server/utils/assets')).readI18nAsset
}

beforeEach(() => {
  vi.resetModules()
  getItemRaw.mockReset()
  readFile.mockReset()
  vi.stubGlobal('__I18N_FS_ASSETS__', false)
})

test('parses an asset once and memoizes the result', async () => {
  const readI18nAsset = await importReadI18nAsset()
  getItemRaw.mockResolvedValue('{"a":1}')

  await expect(readI18nAsset('x.json')).resolves.toEqual({ a: 1 })
  await expect(readI18nAsset('x.json')).resolves.toEqual({ a: 1 })
  expect(getItemRaw).toHaveBeenCalledTimes(1)
})

test('reads each key separately', async () => {
  const readI18nAsset = await importReadI18nAsset()
  getItemRaw.mockResolvedValueOnce('{"a":1}').mockResolvedValueOnce('{"b":2}')

  await expect(readI18nAsset('a.json')).resolves.toEqual({ a: 1 })
  await expect(readI18nAsset('b.json')).resolves.toEqual({ b: 2 })
  expect(getItemRaw).toHaveBeenCalledTimes(2)
})

test('decodes binary values', async () => {
  const readI18nAsset = await importReadI18nAsset()
  getItemRaw.mockResolvedValue(new TextEncoder().encode('{"b":2}'))

  await expect(readI18nAsset('y.json')).resolves.toEqual({ b: 2 })
})

test('throws a named error for missing assets', async () => {
  const readI18nAsset = await importReadI18nAsset()
  getItemRaw.mockResolvedValue(null)

  await expect(readI18nAsset('missing.json')).rejects.toThrow(`Missing messages asset 'missing.json'`)
})

test('reads assets emitted into the server output', async () => {
  vi.stubGlobal('__I18N_FS_ASSETS__', true)
  const readI18nAsset = await importReadI18nAsset()
  readFile.mockResolvedValue('{"d":4}')

  await expect(readI18nAsset('d.json')).resolves.toEqual({ d: 4 })
  expect((readFile.mock.calls[0]![0] as URL).pathname).toMatch(/\/i18n-assets\/d\.json$/)
  expect(getItemRaw).not.toHaveBeenCalled()
})

test('does not memoize failures, reads succeed after a transient error', async () => {
  const readI18nAsset = await importReadI18nAsset()
  getItemRaw.mockRejectedValueOnce(new Error('EBUSY')).mockResolvedValueOnce('{"c":3}')

  await expect(readI18nAsset('c.json')).rejects.toThrow('EBUSY')
  await expect(readI18nAsset('c.json')).resolves.toEqual({ c: 3 })
  expect(getItemRaw).toHaveBeenCalledTimes(2)
})

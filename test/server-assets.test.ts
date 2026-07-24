import { expect, test, vi } from 'vitest'
import { readI18nAsset } from '../src/runtime/server/utils/assets'

const { getItemRaw } = vi.hoisted(() => ({ getItemRaw: vi.fn() }))
vi.mock('nitropack/runtime', () => ({ useStorage: () => ({ getItemRaw }) }))

test('parses an asset once and memoizes the result', async () => {
  getItemRaw.mockResolvedValueOnce('{"a":1}')

  await expect(readI18nAsset('x.json')).resolves.toEqual({ a: 1 })
  await expect(readI18nAsset('x.json')).resolves.toEqual({ a: 1 })
  expect(getItemRaw).toHaveBeenCalledTimes(1)
})

test('decodes binary values', async () => {
  getItemRaw.mockResolvedValueOnce(new TextEncoder().encode('{"b":2}'))

  await expect(readI18nAsset('y.json')).resolves.toEqual({ b: 2 })
})

test('throws a named error for missing assets', async () => {
  getItemRaw.mockResolvedValueOnce(null)

  await expect(readI18nAsset('missing.json')).rejects.toThrow(`Missing messages asset 'missing.json'`)
})

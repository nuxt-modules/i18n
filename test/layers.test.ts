import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { resolveLayerVueI18nConfigInfo } from '../src/layers'
import { logger } from '../src/utils'
import type { I18nNuxtContext } from '../src/context'
import type { Nuxt } from '@nuxt/schema'

const tmpDirs: string[] = []

afterEach(() => {
  vi.restoreAllMocks()

  for (const dir of tmpDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true })
  }
})

describe('resolveLayerVueI18nConfigInfo', () => {
  test('warns when an explicit Vue I18n config path cannot be resolved', async () => {
    const i18nDir = mkdtempSync(join(tmpdir(), 'nuxt-i18n-'))
    tmpDirs.push(i18nDir)

    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    const result = await resolveLayerVueI18nConfigInfo({
      options: { vueI18n: '' },
      i18nLayers: [
        {
          i18n: { vueI18n: './missing.config.ts' },
          i18nDir,
        },
      ],
    } as unknown as I18nNuxtContext, { vfs: {} } as unknown as Nuxt)

    expect(result).toEqual([])
    expect(warn).toHaveBeenCalledWith(`Vue I18n configuration file \`./missing.config.ts\` not found in \`${i18nDir}\`. Skipping...`)
  })
})

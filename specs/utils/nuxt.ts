import { existsSync, promises as fsp } from 'node:fs'
import { defu } from 'defu'
import * as _kit from '@nuxt/kit'
import { useTestContext } from './context'
import { resolve } from 'node:path'
import { relative } from 'pathe'
import { fileURLToPath } from 'node:url'

import type { VitestContext } from './types'

const normalizeWithUnderScore = (name: string) => name.replace(/-/g, '_').replace(/\./g, '_').replace(/\//g, '_')

function getTestKey(ctx: VitestContext) {
  const testPath = ctx.file?.filepath ?? ctx.filepath ?? ''
  const relativePath = relative(__dirname, testPath)
  const testKey = normalizeWithUnderScore(relativePath)

  return testKey
}

// @ts-expect-error type cast
// eslint-disable-next-line
const kit: typeof _kit = _kit.default || _kit

const isNuxtApp = (dir: string) => {
  return (
    existsSync(dir) &&
    (existsSync(resolve(dir, 'pages')) ||
      existsSync(resolve(dir, 'nuxt.config.ts')) ||
      existsSync(resolve(dir, 'nuxt.config.js')) ||
      existsSync(resolve(dir, 'nuxt.config.mjs')) ||
      existsSync(resolve(dir, 'nuxt.config.cjs')))
  )
}

const resolveRootDir = () => {
  const { options } = useTestContext()

  const dirs = [options.rootDir, resolve(options.testDir, options.fixture), process.cwd()]

  for (const dir of dirs) {
    if (dir && isNuxtApp(dir)) {
      return dir
    }
  }

  throw new Error('Invalid nuxt app. (Please explicitly set `options.rootDir` pointing to a valid nuxt app)')
}

export async function loadFixture(testContext: VitestContext) {
  const ctx = useTestContext()

  ctx.options.rootDir = resolveRootDir()

  if (!ctx.options.dev) {
    // NOTE: the following code is original code
    // const randomId = Math.random().toString(36).slice(2, 8)
    // const buildDir = resolve(ctx.options.rootDir, '.nuxt', randomId)

    let testKey = getTestKey(testContext)

    const buildDir = resolve(ctx.options.rootDir, '.nuxt', testKey)
    const outputDir = resolve(ctx.options.rootDir, '.output', testKey)

    ctx.options.nuxtConfig = defu(
      ctx.options.nuxtConfig,
      {
        buildDir,
        modules: [
          (_, nuxt) => {
            /**
             * Register nitro plugin for IPC communication to update runtime config
             */
            nuxt.options.nitro.plugins ||= []
            nuxt.options.nitro.plugins.push(fileURLToPath(new URL('./nitro-plugin', import.meta.url)))
            /**
             * The `overrides` option is only used for testing, it is used to option overrides to the project layer in a fixture.
             */
            if (nuxt.options?.i18n?.overrides) {
              const project = nuxt.options._layers[0]
              const { overrides, ...mergedOptions } = nuxt.options.i18n
              delete nuxt.options.i18n.overrides
              project.config.i18n = defu(overrides, project.config.i18n)
              Object.assign(nuxt.options.i18n, defu(overrides, mergedOptions))
            }
          }
        ],
        _generate: ctx.options.prerender,
        nitro: {
          output: {
            dir: outputDir
          }
        }
      },
      ctx.options.prerender ? { nitro: { static: true, output: { publicDir: resolve(outputDir, 'public') } } } : {}
    )
  }

  ctx.nuxt = await kit.loadNuxt({
    cwd: ctx.options.rootDir,
    dev: ctx.options.dev,
    overrides: ctx.options.nuxtConfig,
    configFile: ctx.options.configFile
  })

  const buildDir = ctx.nuxt.options.buildDir
  const outputDir = ctx.nuxt.options.nitro?.output?.dir
  ctx.teardown ??= []

  await clearDir(buildDir)
  if (outputDir) {
    await clearDir(outputDir)
  }
}

async function clearDir(path: string) {
  await fsp.rm(path, { recursive: true, force: true })
  await fsp.mkdir(path, { recursive: true })
}
export async function buildFixture() {
  const ctx = useTestContext()
  // Hide build info for test
  const prevLevel = kit.logger.level
  kit.logger.level = ctx.options.logLevel
  await kit.buildNuxt(ctx.nuxt!)
  kit.logger.level = prevLevel
}

import { existsSync, promises as fsp } from 'node:fs'
import { resolve } from 'node:path'
import { defu } from 'defu'
import * as _kit from '@nuxt/kit'
import { useTestContext } from './context'
import { relative } from 'pathe'

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
      existsSync(resolve(dir, 'nuxt.config.js')) ||
      existsSync(resolve(dir, 'nuxt.config.mjs')) ||
      existsSync(resolve(dir, 'nuxt.config.cjs')) ||
      existsSync(resolve(dir, 'nuxt.config.ts')))
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

    ctx.options.nuxtConfig = defu(ctx.options.nuxtConfig, {
      buildDir,
      // NOTE: the following code is added for prerender
      _generate: ctx.options.prerender,
      nitro: {
        ...(ctx.options.prerender ? { static: true } : {}),
        output: {
          dir: outputDir,
          ...(ctx.options.prerender ? { publicDir: resolve(outputDir, 'public') } : {})
        }
      }
    })
  }

  ctx.nuxt = await kit.loadNuxt({
    cwd: ctx.options.rootDir,
    dev: ctx.options.dev,
    overrides: ctx.options.nuxtConfig,
    configFile: ctx.options.configFile
  })

  // NOTE: the following code is original code
  // await fsp.mkdir(ctx.nuxt.options.buildDir, { recursive: true })
  await clearDir(ctx.nuxt.options.buildDir)
  if (ctx.nuxt.options.nitro?.output?.dir) {
    await clearDir(ctx.nuxt.options.nitro.output?.dir)
  }
}

export async function clearDir(path: string) {
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

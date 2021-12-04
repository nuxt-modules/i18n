import createDebug from 'debug'
import { resolve } from 'pathe'
import { promisify } from 'util'
import child_process from 'child_process'
import { fixtureDir } from '../utils'

import type { NitroContext } from '../types'

const TEST_BRIDGE = Boolean(process.env.TEST_BRIDGE)
const TEST_PRESET = process.env.TEST_PRESET || 'node'
const TEST_BUILD_TIMEOUT = process.env.TEST_BUILD_TIMEOUT || 20000

const debug = createDebug('mocha:hooks:build')

export const mochaHooks = {
  async beforeAll() {
    debug('mocha:hooks:build:beforeAll')
    // @ts-ignore
    this.timeout(TEST_BUILD_TIMEOUT)

    const fixture = TEST_BRIDGE ? 'bridge' : 'nuxt3'
    const rootDir = fixtureDir(fixture)
    const buildDir = resolve(rootDir, '.nuxt')
    debug(fixture, rootDir, buildDir)

    const ctx: NitroContext = {
      rootDir,
      outDir: resolve(rootDir, '.output')
    }

    const nuxtCLI = TEST_BRIDGE
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resolve(ctx.rootDir!, 'node_modules/nuxt-edge/bin/nuxt.js')
      : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resolve(ctx.rootDir!, 'node_modules/nuxi/bin/nuxi.mjs')

    const exec = promisify(child_process.execFile)
    const { stdout, stderr } = await exec(
      process.execPath,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      [nuxtCLI, 'build', ctx.rootDir!],
      {
        env: {
          NITRO_PRESET: TEST_PRESET,
          NITRO_BUILD_DIR: buildDir,
          NITRO_OUTPUT_DIR: ctx.outDir,
          NODE_ENV: 'production'
        }
      }
    )
    debug('nuxt build result', stdout, stderr)

    // set nitro context to global
    ;(globalThis as any).NITRO_CXT = ctx // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  afterAll() {
    debug('mocha:hooks:build:afterAll')
  },
  beforeEach() {
    debug('mocha:hooks:build:beforeEach')
  },
  afterEach() {
    debug('mocha:hooks:build:afterEach')
  }
}

import { resolve } from 'pathe'
import { promisify } from 'util'
import child_process from 'child_process'
import { fixtureDir, saveNitroContextInfo, removeNitroContextInfo } from '../utils'

import type { EnvMode, NitroContextInfo, FixtureMode } from '../types'

const TEST_BRIDGE = Boolean(process.env.TEST_BRIDGE)
const TEST_PRESET = process.env.TEST_PRESET || 'node'
const TEST_NODE_ENV = (process.env.NODE_ENV || 'production') as EnvMode

export async function setup() {
  // console.log('global setup: build', TEST_BRIDGE, TEST_PRESET)
  const fixture: FixtureMode = TEST_BRIDGE ? 'bridge' : 'nuxt3'
  const rootDir = fixtureDir(fixture)
  const buildDir = resolve(rootDir, '.nuxt')
  const outDir = resolve(rootDir, '.output')
  // console.log(fixture, rootDir, buildDir)

  const nuxtCLI = TEST_BRIDGE
    ? resolve(rootDir, 'node_modules/nuxt-edge/bin/nuxt.js')
    : resolve(rootDir, 'node_modules/nuxi/bin/nuxi.mjs')

  const exec = promisify(child_process.execFile)
  const { stdout, stderr } = await exec(process.execPath, [nuxtCLI, 'build', rootDir], {
    env: {
      NITRO_PRESET: TEST_PRESET,
      NITRO_BUILD_DIR: buildDir,
      NITRO_OUTPUT_DIR: outDir,
      NODE_ENV: TEST_NODE_ENV
    }
  })

  console.log('nuxt build result', stdout, stderr)

  // persist nitro context info per tests
  const ctxInfo: NitroContextInfo = {
    rootDir,
    outDir,
    buildDir,
    fixture,
    env: TEST_NODE_ENV,
    preset: TEST_PRESET
  }
  await saveNitroContextInfo(ctxInfo)
}

export async function teardown() {
  // console.log('global teardown: build')

  // remove nitro context info
  await removeNitroContextInfo()
}

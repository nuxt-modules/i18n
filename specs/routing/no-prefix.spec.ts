import { fileURLToPath } from 'node:url'
import { describe, it } from 'vitest'
import { STRATEGIES } from '../../src/constants'
import { setup } from '../utils'
import { localePathTests } from './routing-tests'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: STRATEGIES.NO_PREFIX
    }
  }
})
describe('localePath', async () => {
  describe(`route strategy: ${STRATEGIES.NO_PREFIX}`, async () => {
    it('should be worked', async () => {
      await localePathTests(STRATEGIES.NO_PREFIX)
    })
  })
})

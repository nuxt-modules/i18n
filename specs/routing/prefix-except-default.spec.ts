import { fileURLToPath } from 'node:url'
import { describe, it } from 'vitest'
import { STRATEGIES } from '../../src/constants'
import { setup } from '../utils'
import { localePathTests } from './locale-path'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: STRATEGIES.PREFIX_EXCEPT_DEFAULT
    }
  }
})
describe('localePath', async () => {
  describe(`route strategy: ${STRATEGIES.PREFIX_EXCEPT_DEFAULT}`, async () => {
    it('should be worked', async () => {
      await localePathTests(STRATEGIES.PREFIX_EXCEPT_DEFAULT)
    })
  })
})

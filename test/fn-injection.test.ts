import { describe, it, expect } from 'vitest'
import { collectMissingI18nFunctions } from '../src/transform/i18n-function-injection'

describe('collectMissingI18nFunctions', () => {
  const id = 'test.ts'

  it('collects undeclared i18n function calls', () => {
    const script = `
        function test() {
          $t('hello')
          $d(new Date())
        }
      `
    expect(collectMissingI18nFunctions(script, id)).toEqual(new Set(['$t', '$d']))
  })

  it('collects i18n function calls from destructured variables', () => {
    const script = `
        const { t: $t } = useI18n()
        function test() {
          $t('hello')
          $d(new Date())
        }
        onMounted(() => {
          const $n = () => 1234
          console.log($n('mounted'))
        })
      `
    expect(collectMissingI18nFunctions(script, id)).toEqual(new Set(['$d']))
  })

  it('collects i18n function calls from typescript', () => {
    const script = `
        const helloText = $t('hello')

        function myFn(val: string) {
          return val
        }
      `
    expect(collectMissingI18nFunctions(script, id)).toEqual(new Set(['$t']))
  })
})

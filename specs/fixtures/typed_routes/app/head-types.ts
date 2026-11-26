/**
 * Type-level assertions for `useLocaleHead` (#4061).
 *
 * Never executed, only checked by this fixture's `test:types` script. The return
 * value must stay narrow enough to be accepted by `useHeadSafe`, not just `useHead`.
 */
import { describe, expectTypeOf, it } from 'vitest'
import { useHead, useHeadSafe, useLocaleHead } from '#imports'

describe('useLocaleHead', () => {
  it('is accepted by both useHead and useHeadSafe', () => {
    const head = useLocaleHead()
    useHead(head)
    useHeadSafe(head)
  })

  // #4149
  it('types meta content as string', () => {
    expectTypeOf(useLocaleHead().value.meta[0]!.content).toEqualTypeOf<string>()
  })
})

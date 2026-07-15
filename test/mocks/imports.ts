export { computed, effectScope, getCurrentScope, onScopeDispose, ref, watch } from 'vue'

export type HeadEntry = { input: unknown, patches: unknown[], patch: (input: unknown) => void }

/** Entries created through `useHead`, reset between tests */
export const headEntries: HeadEntry[] = []

export function useHead(input: unknown): HeadEntry {
  const entry: HeadEntry = { input, patches: [], patch: val => entry.patches.push(val) }
  headEntries.push(entry)
  return entry
}

export function useRequestEvent() {
  return undefined
}

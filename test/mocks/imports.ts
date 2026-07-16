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

// unused stubs so modules with Nuxt composable imports can be loaded (e.g. `runtime/context.ts`)
export const useCookie = undefined
export const useNuxtApp = undefined
export const useRequestURL = undefined
export const useRouter = undefined
export const useRuntimeConfig = undefined
export const useState = undefined

import type { NuxtI18nOptions, NuxtI18nInternalOptions } from './types'

/**
 * stub type definition for nuxt plugin
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadMessages: () => Promise<any> = () => Promise.resolve({})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolveNuxtI18nOptions: (context: any) => Promise<Required<NuxtI18nOptions>> = () => Promise.resolve({})
export const localeCodes: string[] = []
export const nuxtI18nOptions: Required<NuxtI18nOptions> = {}
export const nuxtI18nInternalOptions: Required<NuxtI18nInternalOptions> = {}

export type { NuxtI18nInternalOptions } from './types'

import type { NuxtI18nOptions } from './types'

// stub type definition for nuxt plugin
export const messages: () => Promise<any> = () => Promise.resolve({})
export const localeCodes: string[] = []
export const nuxtI18nOptions: Required<NuxtI18nOptions> = {}

export type { NuxtI18nInternalOptions } from './types'

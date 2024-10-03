import type { NuxtApp } from 'nuxt/app'

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const nuxtMock: { runWithContext: NuxtApp['runWithContext'] } = { runWithContext: async fn => await fn() }

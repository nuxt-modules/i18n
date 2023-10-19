import { consola } from 'consola'
import { vi } from 'vitest'
import { logger } from '@nuxt/kit'

consola.mockTypes(() => vi.fn())
logger.mockTypes(() => vi.fn())

const _warn = console.warn.bind(console)

const hiddenWarns = ['[@vue/reactivity-transform]', '[Vue warn]: Component', '[Vue router warn]']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.warn = (arg0: any, ...args: any[]) => {
  if (typeof arg0 === 'string' && hiddenWarns.some(w => arg0.includes(w))) {
    return
  }
  _warn(...args)
}

// for (const t of ['uncaughtException', 'unhandledRejection'] as const) {
//   process.on(t, (err) => {
//     console.error(`[nuxt test suite] [${t}]`, err)
//   })
// }

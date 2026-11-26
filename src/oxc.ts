import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { directoryToURL, resolveModule, tryUseNuxt } from '@nuxt/kit'

import type { parseSync as oxcParseSync } from 'oxc-parser'
import type { transformSync as oxcTransformSync } from 'oxc-transform'

type Oxc = { parseSync: typeof oxcParseSync, transformSync: typeof oxcTransformSync }

const require = createRequire(import.meta.url)
let oxc: Oxc | undefined

/**
 * Prefer the oxc that Nuxt uses itself - `rolldown/utils` from Nuxt 4.7 - over our own `oxc-*` packages
 */
function loadOxc(): Oxc {
  const moduleURL = new URL(import.meta.url)
  const rootDir = tryUseNuxt()?.options.rootDir
  try {
    // rolldown is a peer of `nuxt`, a strict install only links it next to `nuxt`
    const nuxtURL = rootDir && pathToFileURL(resolveModule('nuxt', { url: directoryToURL(rootDir) }))
    return require(resolveModule('rolldown/utils', { url: nuxtURL ? [nuxtURL, moduleURL] : [moduleURL] }))
  } catch {
    return { parseSync: require('oxc-parser').parseSync, transformSync: require('oxc-transform').transformSync }
  }
}

export const parseSync: typeof oxcParseSync = (...args) => (oxc ??= loadOxc()).parseSync(...args)

export const transformSync: typeof oxcTransformSync = (filename, sourceText, options) => {
  // `rolldown/utils` looks up a tsconfig from the filename unless told not to, `oxc-transform` never reads one
  const transformOptions = { tsconfig: false, ...options }
  return (oxc ??= loadOxc()).transformSync(filename, sourceText, transformOptions)
}

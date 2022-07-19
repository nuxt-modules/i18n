import { fileURLToPath } from 'url'
import { dirname, resolve } from 'pathe'

export const distDir = dirname(fileURLToPath(import.meta.url))
export const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
const pkgDir = resolve(distDir, '..')
export const pkgModulesDir = resolve(pkgDir, './node_modules')

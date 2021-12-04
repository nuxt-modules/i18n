// CommonJS proxy to bypass jiti transforms from nuxt2
module.exports = function (...args) {
  return import('./dist/module.mjs').then(m => m.default.call(this, ...args))
}

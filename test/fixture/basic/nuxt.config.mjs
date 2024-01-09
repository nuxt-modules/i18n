import { resolve } from 'path'
import BaseConfig from '../base.config'

/** @type {import('@nuxt/types').NuxtConfig} */
const config = {
  ...BaseConfig,
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname,
  // Verifies that there is no SSR crash when used that way.
  head () {
    // SPARenderer calls this function without having `this` as the root Vue Component
    // so null-check before calling.
    if (this.$nuxtI18nHead) {
      return this.$nuxtI18nHead({ addSeoAttributes: { canonicalQueries: ['foo'] } })
    }
    return {}
  }
}

module.exports = config

import { resolve } from 'path'
import BaseConfig from '../base.config'

/** @type {import('@nuxt/types').NuxtConfig} */
const config = {
  ...BaseConfig,
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname,
  // Verifies that there is no SSR crash when used that way.
  head () {
    return this.$nuxtI18nHead({ addSeoAttributes: true })
  }
}

module.exports = config

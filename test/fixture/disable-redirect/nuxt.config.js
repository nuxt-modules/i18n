import { resolve } from 'path'
import BaseConfig from '../base.config'

/** @type {import('@nuxt/types').NuxtConfig} */
const config = {
  ...BaseConfig,
  disableDefaultRedirect: true,
  strategy: 'prefix_and_default',
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname,
  buildModules: [
    '@nuxtjs/composition-api/module'
  ]
}

module.exports = config

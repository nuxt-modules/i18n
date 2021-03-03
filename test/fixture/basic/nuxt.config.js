import { resolve } from 'path'
import BaseConfig from '../base.config'

/** @type {import('@nuxt/types').NuxtConfig} */
const config = {
  ...BaseConfig,
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname,
  i18n: {
    ...BaseConfig.i18n,
    lazy: true,
    langDir: 'lang'
  }
}

module.exports = config
